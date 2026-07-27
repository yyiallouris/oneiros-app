/**
 * Flow coverage: documentation/architecture-interpretation.md (remote interpretation metadata mapping).
 */
import type { Interpretation } from '../../src/types/dream';

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { supabase } from '../../src/services/supabaseClient';
import {
  remoteGetInterpretations,
  remoteSaveInterpretation,
} from '../../src/services/remoteStorage';

const mockFrom = supabase.from as jest.Mock;
const mockGetUser = supabase.auth.getUser as jest.Mock;

const interpretation: Interpretation = {
  id: 'interpretation-1',
  dreamId: 'dream-1',
  messages: [{ id: 'message-1', role: 'assistant', content: 'A reflection.', timestamp: 't' }],
  symbols: ['red door'],
  symbol_stances: [{ symbol: 'red door', stance: 'blocking, charged' }],
  archetypes: [{ archetype_id: 'shadow', canonical_label: 'Shadow', expression: '', resonance: '', evidence: [] }],
  landscapes: ['hallway'],
  affects: ['tension'],
  motifs: ['blocked threshold'],
  relational_dynamics: ['distance at entry'],
  thresholds: ['closed door'],
  central_conflicts: ['wanting entry vs blocked door'],
  core_mode: 'Core Tension',
  amplifications: [{ title: '', tradition: '', resonance: 'door as charged boundary', divergence: '', evidence: [] }],
  display_distillation: {
    essence_title: 'Guarded entry',
    essence_line: 'The dream gathers around a guarded threshold.',
    dominant_lens: 'threshold',
    visible_anchors: [
      { label: 'red door', type: 'threshold', salience: 5, ui_meaning: 'a guarded point of entry' },
    ],
    main_tension: 'entry vs protection',
    dream_movement: 'approaching',
    movement_line: 'Something approaches without crossing.',
  },
  metadata_status: 'ready',
  metadata_generated_at: '2026-04-01T00:00:01.000Z',
  metadata_error_code: null,
  reflection_origin: 'paid_cycle',
  chat_replies_used: 2,
  chat_replies_limit: 5,
  origin_quota_event_id: 'quota-event-1',
  origin_entitlement_id: 'entitlement-1',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
};

describe('remoteStorage interpretation metadata flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  });

  it('maps Supabase interpretation rows into full AI metadata fields', async () => {
    const row = {
      id: interpretation.id,
      user_id: 'user-1',
      dream_id: interpretation.dreamId,
      symbols: interpretation.symbols,
      symbol_stances: interpretation.symbol_stances,
      archetypes: interpretation.archetypes,
      landscapes: interpretation.landscapes,
      affects: interpretation.affects,
      motifs: interpretation.motifs,
      relational_dynamics: interpretation.relational_dynamics,
      thresholds: interpretation.thresholds,
      central_conflicts: interpretation.central_conflicts,
      core_mode: interpretation.core_mode,
      amplifications: interpretation.amplifications,
      display_distillation: interpretation.display_distillation,
      metadata_status: interpretation.metadata_status,
      metadata_generated_at: interpretation.metadata_generated_at,
      metadata_error_code: interpretation.metadata_error_code,
      extraction_prompt_version: null,
      extraction_schema_version: null,
      reflection_origin: interpretation.reflection_origin,
      chat_replies_used: interpretation.chat_replies_used,
      chat_replies_limit: interpretation.chat_replies_limit,
      origin_quota_event_id: interpretation.origin_quota_event_id,
      origin_entitlement_id: interpretation.origin_entitlement_id,
      summary: null,
      messages: interpretation.messages,
      created_at: interpretation.createdAt,
      updated_at: interpretation.updatedAt,
    };
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [row], error: null }),
    };
    mockFrom.mockReturnValue(query);

    await expect(remoteGetInterpretations()).resolves.toEqual([interpretation]);
    expect(mockFrom).toHaveBeenCalledWith('interpretations');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('saves all AI metadata fields to the Supabase interpretation row payload', async () => {
    const ownershipQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    };
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockFrom
      .mockReturnValueOnce(ownershipQuery)
      .mockReturnValueOnce({ upsert });

    await remoteSaveInterpretation(interpretation);

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      id: interpretation.id,
      user_id: 'user-1',
      dream_id: interpretation.dreamId,
      symbols: interpretation.symbols,
      symbol_stances: interpretation.symbol_stances,
      archetypes: interpretation.archetypes,
      landscapes: interpretation.landscapes,
      affects: interpretation.affects,
      motifs: interpretation.motifs,
      relational_dynamics: interpretation.relational_dynamics,
      thresholds: interpretation.thresholds,
      central_conflicts: interpretation.central_conflicts,
      core_mode: interpretation.core_mode,
      amplifications: interpretation.amplifications,
      display_distillation: interpretation.display_distillation,
      metadata_status: interpretation.metadata_status,
      metadata_generated_at: interpretation.metadata_generated_at,
      metadata_error_code: interpretation.metadata_error_code,
      extraction_prompt_version: null,
      extraction_schema_version: null,
      reflection_origin: interpretation.reflection_origin,
      chat_replies_used: interpretation.chat_replies_used,
      chat_replies_limit: interpretation.chat_replies_limit,
      origin_quota_event_id: interpretation.origin_quota_event_id,
      origin_entitlement_id: interpretation.origin_entitlement_id,
      summary: null,
      messages: interpretation.messages,
    }), { onConflict: 'id' });
  });
});
