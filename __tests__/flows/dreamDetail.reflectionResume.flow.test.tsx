/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * (leave/kill mid-loading — DreamDetail resumes pending reflection without Reflect again).
 */
import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';

const mockGetDreamById = jest.fn();
const mockGetInterpretationByDreamId = jest.fn();
const mockResumeOrAttachDreamReflection = jest.fn();
const mockHasPendingReflectionJob = jest.fn();
const mockHasReflectionInFlight = jest.fn();
const mockGetPendingReflectionJob = jest.fn();
const mockEnsureDreamMetadataExtraction = jest.fn();
const mockRemoteGetInterpretationById = jest.fn();
const mockLocalSaveInterpretation = jest.fn();

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  useNavigation: () => ({
    setOptions: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: { dreamId: 'dream-1' },
  }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => {
      const cleanup = callback();
      return typeof cleanup === 'function' ? cleanup : undefined;
    }, [callback]);
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../src/components/ui', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    Button: ({ title, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    ),
    PaperBackground: ({ children }: any) => <View>{children}</View>,
    LoadingState: ({ preset }: any) => (
      <View>
        <Text>{preset === 'dreamReflection' ? 'Reflecting on your dream...' : 'Loading...'}</Text>
        {preset === 'dreamReflection' ? (
          <Text>You can leave and return; the reflection will attach when ready.</Text>
        ) : null}
      </View>
    ),
    DreamDetailSkeleton: () => null,
    PrimaryIconButton: ({ onPress, accessibilityLabel }: any) => (
      <TouchableOpacity onPress={onPress} accessibilityLabel={accessibilityLabel}>
        <Text>{accessibilityLabel ?? 'icon button'}</Text>
      </TouchableOpacity>
    ),
    DesignExportForeground: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('../../src/components/ui/PhasedTypingText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    PhasedTypingText: ({ text }: { text: string }) => <Text>{text}</Text>,
  };
});

jest.mock('../../src/components/ui/VoiceRecordButton', () => ({
  VoiceRecordButton: () => null,
}));

jest.mock('../../src/components/subscription/PremiumUpsellModal', () => ({
  PremiumUpsellModal: () => null,
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: any) => <>{children}</>,
    Path: () => null,
  };
});

jest.mock('../../src/utils/storage', () => ({
  getDreamById: (...args: unknown[]) => mockGetDreamById(...args),
  getInterpretationByDreamId: (...args: unknown[]) => mockGetInterpretationByDreamId(...args),
  saveInterpretation: jest.fn(),
  deleteInterpretation: jest.fn(),
  saveDream: jest.fn(),
}));

jest.mock('../../src/services/ai', () => ({
  updateInterpretationElementsFromConversation: jest.fn(async (_dream, interpretation) => interpretation),
}));

jest.mock('../../src/services/userSettingsService', () => ({
  getInterpretationDepth: jest.fn().mockResolvedValue('standard'),
}));

jest.mock('../../src/utils/network', () => ({
  isOnline: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/providers/SubscriptionProvider', () => ({
  useSubscription: () => ({
    status: { hasPaidAccess: true },
    products: [],
    purchasePlan: jest.fn(),
  }),
}));

jest.mock('../../src/services/entitledAiService', () => ({
  EntitlementError: class EntitlementError extends Error {},
  ReflectionStillGeneratingError: class ReflectionStillGeneratingError extends Error {},
  REFLECTION_PARTIAL_REVEAL_AFTER_MS: 15000,
  generateEntitledDreamReflection: jest.fn(),
  generateEntitledFollowupReply: jest.fn(),
  ensureDreamMetadataExtraction: (...args: unknown[]) => mockEnsureDreamMetadataExtraction(...args),
  triggerPendingDreamMetadataExtraction: jest.fn(),
  resumeOrAttachDreamReflection: (...args: unknown[]) => mockResumeOrAttachDreamReflection(...args),
  hasPendingReflectionJob: (...args: unknown[]) => mockHasPendingReflectionJob(...args),
  hasReflectionInFlight: (...args: unknown[]) => mockHasReflectionInFlight(...args),
}));

jest.mock('../../src/services/pendingReflectionJobService', () => ({
  getPendingReflectionJob: (...args: unknown[]) => mockGetPendingReflectionJob(...args),
  setPendingReflectionJob: jest.fn(),
  clearPendingReflectionJob: jest.fn(),
}));

jest.mock('../../src/services/remoteStorage', () => ({
  remoteGetInterpretationById: (...args: unknown[]) => mockRemoteGetInterpretationById(...args),
}));

jest.mock('../../src/services/localStorage', () => ({
  LocalStorage: {
    saveInterpretation: (...args: unknown[]) => mockLocalSaveInterpretation(...args),
  },
}));

import DreamDetailScreen from '../../src/screens/DreamDetailScreen';

const dream = {
  id: 'dream-1',
  date: '2026-07-25',
  title: 'Threshold',
  content: 'A door that would not open.',
  archived: false,
  createdAt: '2026-07-25T00:00:00.000Z',
  updatedAt: '2026-07-25T00:00:00.000Z',
};

const interpretation = {
  id: 'interpretation-1',
  dreamId: 'dream-1',
  messages: [
    {
      id: 'm1',
      role: 'assistant' as const,
      content: 'A resumed reflection.',
      timestamp: '2026-07-25T00:05:00.000Z',
    },
  ],
  symbols: [],
  archetypes: [],
  metadata_status: 'pending' as const,
  createdAt: '2026-07-25T00:05:00.000Z',
  updatedAt: '2026-07-25T00:05:00.000Z',
};

describe('dreamDetail reflection resume flow', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    mockGetDreamById.mockResolvedValue(dream);
    mockGetInterpretationByDreamId.mockResolvedValue(null);
    mockHasReflectionInFlight.mockReturnValue(false);
    mockHasPendingReflectionJob.mockResolvedValue(false);
    mockGetPendingReflectionJob.mockResolvedValue(null);
    mockResumeOrAttachDreamReflection.mockResolvedValue(null);
    mockEnsureDreamMetadataExtraction.mockResolvedValue(null);
    mockRemoteGetInterpretationById.mockResolvedValue(null);
    mockLocalSaveInterpretation.mockResolvedValue(undefined);
  });

  it('resumes a pending reflection on focus without requiring Reflect again', async () => {
    mockHasPendingReflectionJob.mockResolvedValue(true);
    mockGetPendingReflectionJob.mockResolvedValue({
      dreamId: 'dream-1',
      quotaEventId: 'quota-1',
      action: 'dream_reflection_generate',
      depth: 'advanced',
      startedAt: new Date().toISOString(),
    });
    let resolveResume: (value: typeof interpretation) => void = () => undefined;
    mockResumeOrAttachDreamReflection.mockReturnValue(
      new Promise((resolve) => {
        resolveResume = resolve;
      })
    );

    const screen = render(<DreamDetailScreen />);

    expect(await screen.findByText('Reflecting on your dream...')).toBeTruthy();
    expect(screen.queryByText('Reflect on this dream')).toBeNull();
    expect(mockResumeOrAttachDreamReflection).toHaveBeenCalledWith(
      'dream-1',
      expect.objectContaining({ onPartialReflection: expect.any(Function) })
    );

    resolveResume(interpretation);

    await waitFor(() => {
      expect(screen.getAllByText('A resumed reflection.').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Reflect on this dream')).toBeNull();
  });

  it('keeps the Exploring chat surface when resuming after partial-reveal threshold', async () => {
    mockHasPendingReflectionJob.mockResolvedValue(true);
    mockGetPendingReflectionJob.mockResolvedValue({
      dreamId: 'dream-1',
      quotaEventId: 'quota-1',
      action: 'dream_reflection_generate',
      depth: 'advanced',
      startedAt: new Date(Date.now() - 20_000).toISOString(),
    });
    let onPartial: ((progress: { text: string; elapsedMs: number }) => void) | undefined;
    mockResumeOrAttachDreamReflection.mockImplementation((_dreamId, options) => {
      onPartial = options?.onPartialReflection;
      return new Promise(() => {});
    });

    const screen = render(<DreamDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Exploring the dream')).toBeTruthy();
    });
    expect(screen.queryByText('Reflecting on your dream...')).toBeNull();
    expect(screen.queryByText('Reflect on this dream')).toBeNull();

    await waitFor(() => expect(onPartial).toBeDefined());
    await act(async () => {
      onPartial?.({ text: 'Partial text already streaming…', elapsedMs: 20000 });
    });

    await waitFor(() => {
      expect(screen.getByText('Partial text already streaming…')).toBeTruthy();
    });
  });

  it('attaches a remote interpretation when no pending handle exists', async () => {
    mockHasPendingReflectionJob.mockResolvedValue(false);
    mockGetPendingReflectionJob.mockResolvedValue(null);
    mockResumeOrAttachDreamReflection.mockResolvedValue(interpretation);

    const screen = render(<DreamDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('A resumed reflection.')).toBeTruthy();
    });
    expect(mockResumeOrAttachDreamReflection).toHaveBeenCalledWith('dream-1');
    expect(screen.queryByText('Reflect on this dream')).toBeNull();
  });

  it('refreshes pending metadata into the visible interpretation when extraction completes', async () => {
    mockGetInterpretationByDreamId.mockResolvedValue(interpretation);
    mockEnsureDreamMetadataExtraction.mockResolvedValue({
      status: 'committed',
      interpretation_id: interpretation.id,
      metadata_status: 'ready',
    });
    mockRemoteGetInterpretationById.mockResolvedValue({
      ...interpretation,
      metadata_status: 'ready' as const,
      display_distillation: {
        essence_title: 'Guarded threshold',
        essence_line: 'A transition holds.',
        dominant_lens: 'threshold' as const,
        visible_anchors: [],
        main_tension: null,
        dream_movement: 'approaching' as const,
        movement_line: null,
      },
    });

    const screen = render(<DreamDetailScreen />);

    await waitFor(() => {
      expect(mockEnsureDreamMetadataExtraction).toHaveBeenCalledWith('interpretation-1');
    });
    await waitFor(() => {
      expect(mockRemoteGetInterpretationById).toHaveBeenCalledWith('interpretation-1');
    });
    await waitFor(() => {
      expect(mockLocalSaveInterpretation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'interpretation-1',
          metadata_status: 'ready',
        })
      );
    });
    await waitFor(() => {
      expect(screen.queryByText('Dream details are still forming…')).toBeNull();
    });
  });

  it('keeps polling pending metadata past the first refresh window until remote status settles', async () => {
    jest.useFakeTimers();
    mockGetInterpretationByDreamId.mockResolvedValue(interpretation);
    mockEnsureDreamMetadataExtraction.mockImplementation(() => new Promise(() => {}));
    mockRemoteGetInterpretationById
      .mockResolvedValueOnce({ ...interpretation, metadata_status: 'pending' as const })
      .mockResolvedValueOnce({ ...interpretation, metadata_status: 'pending' as const })
      .mockResolvedValueOnce({ ...interpretation, metadata_status: 'pending' as const })
      .mockResolvedValueOnce({ ...interpretation, metadata_status: 'pending' as const })
      .mockResolvedValueOnce({ ...interpretation, metadata_status: 'pending' as const })
      .mockResolvedValueOnce({
        ...interpretation,
        metadata_status: 'ready' as const,
        display_distillation: {
          essence_title: 'Settled later',
          essence_line: 'The delayed metadata finally lands.',
          dominant_lens: 'threshold' as const,
          visible_anchors: [],
          main_tension: null,
          dream_movement: 'approaching' as const,
          movement_line: null,
        },
      });

    render(<DreamDetailScreen />);

    await waitFor(() => {
      expect(mockRemoteGetInterpretationById).toHaveBeenCalledTimes(1);
    });

    const advanceAndFlush = async (ms: number) => {
      await act(async () => {
        jest.advanceTimersByTime(ms);
        await Promise.resolve();
        await Promise.resolve();
      });
    };

    await advanceAndFlush(4000);
    await waitFor(() => expect(mockRemoteGetInterpretationById).toHaveBeenCalledTimes(2));

    await advanceAndFlush(12000);
    await waitFor(() => expect(mockRemoteGetInterpretationById).toHaveBeenCalledTimes(3));

    await advanceAndFlush(25000);
    await waitFor(() => expect(mockRemoteGetInterpretationById).toHaveBeenCalledTimes(4));

    await advanceAndFlush(45000);
    await waitFor(() => expect(mockRemoteGetInterpretationById).toHaveBeenCalledTimes(5));

    await advanceAndFlush(60000);

    await waitFor(() => {
      expect(mockRemoteGetInterpretationById).toHaveBeenCalledTimes(6);
    });
    await waitFor(() => {
      expect(mockLocalSaveInterpretation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'interpretation-1',
          metadata_status: 'ready',
        })
      );
    });
  });
});
