/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md and flows-07-insights-reports.md
 * (entitled AI gateway responses, local cache/persistence, and denial reasons).
 */
import type { Dream, Interpretation } from '../../src/types/dream';
import {
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_SCHEMA_VERSION,
} from '../../src/ai/dreamExtractionPrompt';

jest.mock('../../src/services/subscriptionService', () => ({
  createIdempotencyKey: jest.fn((action: string, scope: string) => `idem:${action}:${scope}`),
  invokeAiEntitlementsGateway: jest.fn(),
}));

jest.mock('../../src/services/remoteStorage', () => ({
  remoteGetInterpretationByDreamId: jest.fn(),
  remoteGetInterpretationById: jest.fn(),
}));

jest.mock('../../src/services/storageService', () => ({
  StorageService: {
    saveInterpretation: jest.fn(),
  },
}));

jest.mock('../../src/services/localStorage', () => ({
  LocalStorage: {
    saveInterpretation: jest.fn(),
    saveRecentSequenceReflection: jest.fn(),
    savePatternReport: jest.fn(),
  },
}));

jest.mock('../../src/services/pendingReflectionJobService', () => ({
  setPendingReflectionJob: jest.fn(() => Promise.resolve()),
  getPendingReflectionJob: jest.fn(() => Promise.resolve(null)),
  clearPendingReflectionJob: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../src/services/patternInsightsService', () => ({
  getRecentPatternInsightEntries: jest.fn(),
  getRecentSequenceScopeKey: jest.fn((dreamIds: string[], count: number) => `recent:${count}:${dreamIds.join('|')}`),
}));

import {
  applyDebugMetadataRecovery,
  EntitlementError,
  generateEntitledDreamReflection,
  generateEntitledFollowupReply,
  generateEntitledPeriodReflection,
  generateEntitledRecentDreamField,
  ReflectionStillGeneratingError,
  resumeOrAttachDreamReflection,
  summarizeDebugEchoPacket,
} from '../../src/services/entitledAiService';
import {
  clearPendingReflectionJob,
  getPendingReflectionJob,
  setPendingReflectionJob,
} from '../../src/services/pendingReflectionJobService';
import { LocalStorage } from '../../src/services/localStorage';
import { StorageService } from '../../src/services/storageService';
import { invokeAiEntitlementsGateway } from '../../src/services/subscriptionService';
import {
  remoteGetInterpretationByDreamId,
  remoteGetInterpretationById,
} from '../../src/services/remoteStorage';
import { getRecentPatternInsightEntries } from '../../src/services/patternInsightsService';

const mockGateway = invokeAiEntitlementsGateway as jest.MockedFunction<typeof invokeAiEntitlementsGateway>;
const mockRemoteByDreamId = remoteGetInterpretationByDreamId as jest.MockedFunction<typeof remoteGetInterpretationByDreamId>;
const mockRemoteById = remoteGetInterpretationById as jest.MockedFunction<typeof remoteGetInterpretationById>;
const mockRecentEntries = getRecentPatternInsightEntries as jest.MockedFunction<typeof getRecentPatternInsightEntries>;

const dream: Dream = {
  id: 'dream-1',
  title: 'Door',
  date: '2026-04-01',
  content: 'A red door would not open.',
  archived: false,
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
};

const interpretation: Interpretation = {
  id: 'interpretation-1',
  dreamId: dream.id,
  messages: [{ id: 'message-1', role: 'assistant', content: 'A reflection.', timestamp: 't' }],
  symbols: ['red door'],
  archetypes: [],
  createdAt: 't',
  updatedAt: 't',
};

describe('entitled AI service flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    (getPendingReflectionJob as jest.Mock).mockResolvedValue(null);
    (setPendingReflectionJob as jest.Mock).mockResolvedValue(undefined);
    (clearPendingReflectionJob as jest.Mock).mockResolvedValue(undefined);
    mockRemoteByDreamId.mockResolvedValue(interpretation);
    mockRemoteById.mockResolvedValue(interpretation);
    mockRecentEntries.mockResolvedValue([
      {
        dreamId: 'dream-1',
        date: '2026-04-01',
        extracted: {
          symbols: ['red door'],
          symbol_stances: [],
          archetypes: [],
          landscapes: [],
          affects: [],
          motifs: [],
          relational_dynamics: [],
          thresholds: [],
          central_conflicts: [],
          core_mode: null,
          amplifications: [],
        },
        interpretation: 'A reflection.',
      },
      {
        dreamId: 'dream-2',
        date: '2026-04-02',
        extracted: {
          symbols: ['hallway'],
          symbol_stances: [],
          archetypes: [],
          landscapes: [],
          affects: [],
          motifs: [],
          relational_dynamics: [],
          thresholds: [],
          central_conflicts: [],
          core_mode: null,
          amplifications: [],
        },
        interpretation: 'Another reflection.',
      },
    ]);
  });

  it('generates a dream reflection through the gateway, reloads remote interpretation, and saves it locally', async () => {
    mockGateway.mockResolvedValue({
      status: 'committed',
      interpretation_id: interpretation.id,
      reflection: 'A reflection.',
    });

    await expect(generateEntitledDreamReflection(dream, 'standard', 'dream_reflection_generate')).resolves.toEqual(interpretation);

    expect(mockGateway).toHaveBeenCalledWith({
      action: 'dream_reflection_generate',
      idempotencyKey: 'dream_reflection_generate:dream-1',
      dreamId: dream.id,
      depth: 'standard',
      async: true,
    });
    expect(mockGateway).toHaveBeenCalledTimes(1);
    expect(mockRemoteByDreamId).toHaveBeenCalledWith(dream.id);
    expect(StorageService.saveInterpretation).toHaveBeenCalledWith(interpretation);
  });

  it('uses the canonical gateway interpretation payload without a second remote fetch', async () => {
    const pendingInterpretation: Interpretation = {
      ...interpretation,
      symbols: [],
      archetypes: [],
      metadata_status: 'pending',
      metadata_generated_at: null,
      metadata_error_code: null,
    };
    mockGateway
      .mockResolvedValueOnce({
        status: 'committed',
        interpretation_id: interpretation.id,
        reflection: 'A reflection.',
        interpretation: pendingInterpretation,
      })
      .mockResolvedValueOnce({
        status: 'committed',
        interpretation_id: interpretation.id,
        metadata_status: 'ready',
      });

    await expect(generateEntitledDreamReflection(dream, 'standard', 'dream_reflection_generate')).resolves.toEqual(pendingInterpretation);

    expect(mockRemoteByDreamId).not.toHaveBeenCalled();
    expect(StorageService.saveInterpretation).not.toHaveBeenCalled();
    expect(LocalStorage.saveInterpretation).toHaveBeenCalledWith(pendingInterpretation);
    expect(mockGateway).toHaveBeenNthCalledWith(1, {
      action: 'dream_reflection_generate',
      idempotencyKey: 'dream_reflection_generate:dream-1',
      dreamId: dream.id,
      depth: 'standard',
      async: true,
    });
    expect(mockGateway).toHaveBeenNthCalledWith(2, {
      action: 'dream_metadata_extract',
      idempotencyKey: `idem:dream_metadata_extract:interpretation-1:${DREAM_EXTRACTION_PROMPT_ID}:s${DREAM_EXTRACTION_SCHEMA_VERSION}`,
      interpretationId: interpretation.id,
      debug_interpretive_echoes: true,
    });
  });

  it('starts metadata extraction recovery when the remote fallback row is still pending', async () => {
    const pendingInterpretation: Interpretation = {
      ...interpretation,
      id: 'interpretation-remote-pending',
      symbols: [],
      archetypes: [],
      metadata_status: 'pending',
      metadata_generated_at: null,
      metadata_error_code: null,
    };
    mockRemoteByDreamId.mockResolvedValue(pendingInterpretation);
    mockGateway
      .mockResolvedValueOnce({
        status: 'committed',
        interpretation_id: pendingInterpretation.id,
        reflection: 'A reflection.',
      })
      .mockResolvedValueOnce({
        status: 'committed',
        interpretation_id: pendingInterpretation.id,
        metadata_status: 'ready',
      });

    await expect(generateEntitledDreamReflection(dream, 'standard', 'dream_reflection_generate')).resolves.toEqual(pendingInterpretation);

    expect(mockRemoteByDreamId).toHaveBeenCalledWith(dream.id);
    expect(StorageService.saveInterpretation).toHaveBeenCalledWith(pendingInterpretation);
    expect(mockGateway).toHaveBeenNthCalledWith(2, {
      action: 'dream_metadata_extract',
      idempotencyKey: `idem:dream_metadata_extract:interpretation-remote-pending:${DREAM_EXTRACTION_PROMPT_ID}:s${DREAM_EXTRACTION_SCHEMA_VERSION}`,
      interpretationId: pendingInterpretation.id,
      debug_interpretive_echoes: true,
    });
  });

  it('starts long reflections asynchronously, polls status, then saves the committed payload', async () => {
    const pendingInterpretation: Interpretation = {
      ...interpretation,
      symbols: [],
      archetypes: [],
      metadata_status: 'pending',
      metadata_generated_at: null,
      metadata_error_code: null,
    };
    mockGateway
      .mockResolvedValueOnce({
        status: 'pending',
        quota_event_id: 'quota-1',
      })
      .mockResolvedValueOnce({
        status: 'committed',
        quota_event_id: 'quota-1',
        interpretation_id: interpretation.id,
        reflection: 'A reflection.',
        interpretation: pendingInterpretation,
      })
      .mockResolvedValueOnce({
        status: 'committed',
        interpretation_id: interpretation.id,
        metadata_status: 'ready',
      });

    await expect(generateEntitledDreamReflection(dream, 'advanced', 'dream_reflection_generate')).resolves.toEqual(pendingInterpretation);

    expect(mockGateway).toHaveBeenNthCalledWith(1, {
      action: 'dream_reflection_generate',
      idempotencyKey: 'dream_reflection_generate:dream-1',
      dreamId: dream.id,
      depth: 'advanced',
      async: true,
    });
    expect(setPendingReflectionJob).toHaveBeenCalledWith(
      expect.objectContaining({
        dreamId: dream.id,
        quotaEventId: 'quota-1',
        action: 'dream_reflection_generate',
        depth: 'advanced',
      })
    );
    expect(mockGateway).toHaveBeenNthCalledWith(2, {
      action: 'dream_reflection_status',
      idempotencyKey: 'idem:dream_reflection_status:quota-1',
      dreamId: dream.id,
      quotaEventId: 'quota-1',
    });
    expect(clearPendingReflectionJob).toHaveBeenCalledWith(dream.id);
    expect(LocalStorage.saveInterpretation).toHaveBeenCalledWith(pendingInterpretation);
    expect(mockRemoteByDreamId).not.toHaveBeenCalled();
  });

  it('resumes a persisted pending reflection job and clears the handle on commit', async () => {
    const pendingInterpretation: Interpretation = {
      ...interpretation,
      metadata_status: 'pending',
      metadata_generated_at: null,
      metadata_error_code: null,
    };
    (getPendingReflectionJob as jest.Mock).mockResolvedValueOnce({
      dreamId: dream.id,
      quotaEventId: 'quota-resume',
      action: 'dream_reflection_generate',
      depth: 'advanced',
      startedAt: new Date(Date.now() - 5000).toISOString(),
    });
    mockGateway.mockResolvedValueOnce({
      status: 'committed',
      quota_event_id: 'quota-resume',
      interpretation_id: interpretation.id,
      reflection: 'A reflection.',
      interpretation: pendingInterpretation,
    });

    await expect(resumeOrAttachDreamReflection(dream.id)).resolves.toEqual(pendingInterpretation);
    expect(mockGateway).toHaveBeenCalledWith({
      action: 'dream_reflection_status',
      idempotencyKey: 'idem:dream_reflection_status:quota-resume',
      dreamId: dream.id,
      quotaEventId: 'quota-resume',
    });
    expect(clearPendingReflectionJob).toHaveBeenCalledWith(dream.id);
  });

  it('keeps the pending handle on soft poll timeout', async () => {
    jest.useFakeTimers();
    mockGateway
      .mockResolvedValueOnce({
        status: 'pending',
        quota_event_id: 'quota-slow',
      })
      .mockResolvedValue({
        status: 'pending',
        quota_event_id: 'quota-slow',
      });

    const promise = generateEntitledDreamReflection(dream, 'advanced', 'dream_reflection_generate');
    const expectation = expect(promise).rejects.toBeInstanceOf(ReflectionStillGeneratingError);

    await jest.runAllTimersAsync();
    await expectation;

    expect(setPendingReflectionJob).toHaveBeenCalled();
    expect(clearPendingReflectionJob).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('attaches a remote interpretation when no pending handle exists', async () => {
    (getPendingReflectionJob as jest.Mock).mockResolvedValueOnce(null);
    mockRemoteByDreamId.mockResolvedValueOnce(interpretation);

    await expect(resumeOrAttachDreamReflection(dream.id)).resolves.toEqual(interpretation);
    expect(StorageService.saveInterpretation).toHaveBeenCalledWith(interpretation);
    expect(mockGateway).not.toHaveBeenCalled();
  });

  it('generates a follow-up reply and syncs the updated interpretation by id', async () => {
    mockGateway.mockResolvedValue({
      status: 'committed',
      interpretation_id: interpretation.id,
      assistant_reply: 'Follow-up reply.',
    });

    await expect(generateEntitledFollowupReply(interpretation.id, 'What does the door mean?')).resolves.toEqual(interpretation);

    expect(mockGateway).toHaveBeenCalledWith({
      action: 'dream_followup_reply',
      idempotencyKey: 'idem:dream_followup_reply:interpretation-1',
      interpretationId: interpretation.id,
      message: 'What does the door mean?',
    });
    expect(mockRemoteById).toHaveBeenCalledWith(interpretation.id);
    expect(StorageService.saveInterpretation).toHaveBeenCalledWith(interpretation);
  });

  it('saves committed or cached recent dream field artifacts by exact recent sequence', async () => {
    mockGateway.mockResolvedValue({
      status: 'cached',
      content: 'Recent field.',
      scope_key: 'recent:2:gateway-scope',
    });

    await expect(generateEntitledRecentDreamField(2, 'en')).resolves.toBe('Recent field.');

    expect(mockGateway).toHaveBeenCalledWith({
      action: 'recent_dream_field_generate',
      idempotencyKey: 'idem:recent_dream_field_generate:2:en',
      count: 2,
      language: 'en',
    });
    expect(LocalStorage.saveRecentSequenceReflection).toHaveBeenCalledWith(expect.objectContaining({
      scope_type: 'recent_sequence',
      scope_key: 'recent:2:gateway-scope',
      dream_ids: ['dream-1', 'dream-2'],
      dream_count: 2,
      language: 'en',
      content: 'Recent field.',
    }));
  });

  it('saves period reflections with the gateway scope key', async () => {
    mockGateway.mockResolvedValue({
      status: 'committed',
      content: 'Period field.',
      scope_key: '2026-04-W2',
    });

    await expect(generateEntitledPeriodReflection('2026-04', 'el')).resolves.toBe('Period field.');

    expect(mockGateway).toHaveBeenCalledWith({
      action: 'period_reflection_generate',
      idempotencyKey: 'idem:period_reflection_generate:2026-04:el',
      monthKey: '2026-04',
      language: 'el',
    });
    expect(LocalStorage.savePatternReport).toHaveBeenCalledWith('2026-04-W2', 'Period field.');
  });

  it('maps gateway denial reasons to entitlement errors used by UI flows', async () => {
    mockGateway.mockResolvedValue({
      status: 'denied',
      reason: 'paid_reflection_read_only_after_lapse',
    });

    await expect(generateEntitledFollowupReply(interpretation.id, 'Can we continue?')).rejects.toMatchObject({
      reason: 'paid_reflection_read_only_after_lapse',
      premiumRequired: true,
      readOnlyAfterLapse: true,
    });
    await expect(generateEntitledFollowupReply(interpretation.id, 'Can we continue?')).rejects.toBeInstanceOf(EntitlementError);
  });

  it('can recover local interpretive echoes from a debug metadata packet when the persisted row is stale', () => {
    const recovered = applyDebugMetadataRecovery(interpretation, {
      status: 'committed',
      interpretation_id: interpretation.id,
      metadata_status: 'ready',
      debug_interpretive_echoes: {
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: '4.1.10-M2.2',
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        post_validation_archetypes: [
          {
            archetype_id: 'guide_psychopomp',
            expression: 'the woman who brings me to the door and stops there',
            resonance: 'A guiding presence escorts the crossing without taking it for the dreamer.',
            evidence_ids: ['D2', 'D6'],
            confidence: 'high',
          },
        ],
        post_validation_amplifications: [
          {
            catalog_id: 'greek.cretan_labyrinth',
            resonance: 'A thread leads through a winding centre toward a bound creature.',
            divergence: 'Here the creature is fed rather than defeated.',
            evidence: ['thread', 'labyrinth', 'bound being'],
            confidence: 'high',
          },
        ],
      },
    });

    expect(recovered).not.toBeNull();
    expect(recovered?.metadata_status).toBe('ready');
    expect(recovered?.archetypes).toEqual([
      expect.objectContaining({
        canonical_label: 'Guide / Psychopomp',
        archetype_id: 'guide_psychopomp',
      }),
    ]);
    expect(recovered?.amplifications).toEqual([
      expect.objectContaining({
        catalog_id: 'greek.cretan_labyrinth',
        title: 'Ariadne and the Cretan Labyrinth',
      }),
    ]);
  });

  it('can recover archetypes from raw debug model rows when post-validation archetypes are empty', () => {
    const recovered = applyDebugMetadataRecovery(interpretation, {
      status: 'committed',
      interpretation_id: interpretation.id,
      metadata_status: 'ready',
      debug_interpretive_echoes: {
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: '4.1.10-M2.2',
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        post_validation_archetypes: [],
        post_validation_amplifications: [],
        mythic_echo_pipeline: {
          raw_model_archetypes: [
            {
              archetype_id: 'wise_old_woman',
              expression: 'the old fisherwoman who warns against opening the vessel',
              resonance: 'A seasoned elder names the cost of release before the action is taken.',
              evidence_ids: ['D9', 'D10'],
              confidence: 'medium',
            },
            {
              archetype_id: 'guide_psychopomp',
              expression: 'the black bird that leads toward the hidden chamber',
              resonance: 'A small guide carries the dreamer from dry ground into an inner crossing.',
              evidence_ids: ['D43', 'D46'],
              confidence: 'medium',
            },
          ],
        },
      },
    });

    expect(recovered?.archetypes).toEqual([
      expect.objectContaining({
        canonical_label: 'Wise Old Woman',
        archetype_id: 'wise_old_woman',
      }),
      expect.objectContaining({
        canonical_label: 'Guide / Psychopomp',
        archetype_id: 'guide_psychopomp',
      }),
    ]);
  });

  it('summarizes raw vs post-validation archetype counts from a debug packet', () => {
    const summary = summarizeDebugEchoPacket({
      status: 'committed',
      interpretation_id: interpretation.id,
      metadata_status: 'ready',
      cached: false,
      debug_interpretive_echoes: {
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: '4.1.10-M2.2',
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        post_validation_archetypes: [
          {
            archetype_id: 'guide_psychopomp',
            expression: 'the woman who brings me to the door and stops there',
            resonance: 'A guiding presence escorts the crossing without taking it for the dreamer.',
            evidence_ids: ['D2', 'D6'],
            confidence: 'high',
          },
        ],
        post_validation_amplifications: [],
        mythic_echo_pipeline: {
          raw_model_archetypes: [
            { archetype_id: 'guide_psychopomp' },
            { archetype_id: 'divine_child' },
          ],
        },
      },
    });

    expect(summary).toEqual({
        promptVersion: '4.1.10-M2.2',
      rawArchetypeCount: 2,
      postValidationArchetypeCount: 1,
      postValidationMythicCount: 0,
      cached: false,
    });
  });
});
