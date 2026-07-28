/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * (DreamDetail Exploring chat must keep full multi-section reflection scrollable).
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

const mockChatScrollToEnd = jest.fn();
const mockSetOptions = jest.fn();
const mockGetDreamById = jest.fn();
const mockGetInterpretationByDreamId = jest.fn();
const mockIsOnline = jest.fn();
const mockPurchasePlan = jest.fn();
const mockGenerateEntitledDreamReflection = jest.fn();
const mockGenerateEntitledFollowupReply = jest.fn();
const mockSaveInterpretation = jest.fn();
const mockUpdateInterpretationElementsFromConversation = jest.fn(
  async (_dream, interpretation, _messages) => interpretation
);

jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () => {
  const React = require('react');
  const { View } = jest.requireActual('react-native');
  const MockScrollView = React.forwardRef(({ children, ...props }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      scrollToEnd: mockChatScrollToEnd,
    }));
    return <View {...props}>{children}</View>;
  });
  MockScrollView.displayName = 'MockScrollView';

  return {
    __esModule: true,
    default: MockScrollView,
  };
});

jest.mock('@react-navigation/native', () => ({
  __esModule: true,
  useNavigation: () => ({
    setOptions: mockSetOptions,
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: { dreamId: 'dream-1' },
  }),
  useFocusEffect: (callback: () => void) => {
    const React = require('react');
    React.useEffect(() => callback(), [callback]);
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../src/components/ui', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    Card: ({ children }: any) => <View>{children}</View>,
    Button: ({ title, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    ),
    Chip: ({ label }: any) => <Text>{label}</Text>,
    PaperBackground: ({ children }: any) => <View>{children}</View>,
    LegacyWaveBackground: ({ children }: any) => <View>{children}</View>,
    LegacyMountainWaveBackground: ({ children }: any) => <View>{children}</View>,
    MysticHeader: ({ title, subtitle, left, right }: any) => (
      <View>
        {left}
        <Text>{title}</Text>
        {subtitle ? <Text>{subtitle}</Text> : null}
        {right}
      </View>
    ),
    BreathingLine: () => null,
    PrintPatchLoader: () => null,
    DreamDetailSkeleton: () => null,
    LoadingState: ({ preset, testID }: any) => (
      <View>
        <Text testID={testID}>{preset === 'dreamReflection' ? 'Reflecting on your dream...' : 'Loading...'}</Text>
      </View>
    ),
    PrimaryIconButton: ({ onPress, accessibilityLabel, testID, children }: any) => (
      <TouchableOpacity onPress={onPress} accessibilityLabel={accessibilityLabel} testID={testID}>
        <Text>{accessibilityLabel ?? 'icon button'}</Text>
        {children}
      </TouchableOpacity>
    ),
    SectionTitleWithInfo: ({ title }: any) => <Text>{title}</Text>,
    SymbolInfoModal: () => null,
    DesignExportForeground: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('../../src/components/ui/PhasedTypingText', () => ({
  PhasedTypingText: ({ text }: { text: string }) => text,
}));

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
    Circle: () => null,
    Defs: () => null,
    RadialGradient: () => null,
    Stop: () => null,
  };
});

jest.mock('../../src/utils/storage', () => ({
  getDreamById: (...args: unknown[]) => mockGetDreamById(...args),
  getInterpretationByDreamId: (...args: unknown[]) => mockGetInterpretationByDreamId(...args),
  saveInterpretation: (...args: unknown[]) => mockSaveInterpretation(...args),
  deleteInterpretation: jest.fn(),
  saveDream: jest.fn(),
}));

jest.mock('../../src/services/ai', () => ({
  generateInitialInterpretation: jest.fn(),
  sendChatMessage: jest.fn(),
  filterArchetypesForDisplay: (value: string[]) => value,
  updateInterpretationElementsFromConversation: (dreamArg: unknown, interpretationArg: unknown, messagesArg: unknown) =>
    mockUpdateInterpretationElementsFromConversation(dreamArg, interpretationArg, messagesArg),
}));

jest.mock('../../src/services/dreamMetadataPrefetchService', () => ({
  getDreamMetadataForReflection: jest.fn(),
  prefetchDreamMetadata: jest.fn(),
}));

jest.mock('../../src/services/userSettingsService', () => ({
  ...jest.requireActual('../../src/services/userSettingsService'),
  getInterpretationDepth: jest.fn().mockResolvedValue('standard'),
  getMythicResonance: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../src/utils/network', () => ({
  isOnline: (...args: unknown[]) => mockIsOnline(...args),
}));

jest.mock('../../src/providers/SubscriptionProvider', () => ({
  useSubscription: () => ({
    status: { hasPaidAccess: false },
    products: [],
    purchasePlan: (...args: unknown[]) => mockPurchasePlan(...args),
  }),
}));

jest.mock('../../src/services/entitledAiService', () => ({
  EntitlementError: class EntitlementError extends Error {},
  ReflectionStillGeneratingError: class ReflectionStillGeneratingError extends Error {},
  generateEntitledDreamReflection: (...args: unknown[]) => mockGenerateEntitledDreamReflection(...args),
  generateEntitledFollowupReply: (...args: unknown[]) => mockGenerateEntitledFollowupReply(...args),
  ensureDreamMetadataExtraction: jest.fn(() => Promise.resolve(null)),
  triggerPendingDreamMetadataExtraction: jest.fn(),
  resumeOrAttachDreamReflection: jest.fn(() => Promise.resolve(null)),
  hasPendingReflectionJob: jest.fn(() => Promise.resolve(false)),
  hasReflectionInFlight: jest.fn(() => false),
}));

jest.mock('../../src/constants/symbolArchetypeInfo', () => ({
  ARCHETYPE_SECTION_TITLES: {
    core: 'Inner structures',
    dynamic: 'Archetypal energies',
  },
  getArchetypeInfoKey: jest.fn(),
}));

import DreamDetailScreen from '../../src/screens/DreamDetailScreen';
import {
  DREAM_DETAIL_CHAT_SCROLL_MAX_HEIGHT,
  DREAM_DETAIL_CHAT_SCROLL_TEST_ID,
} from '../../src/screens/dreamDetailChatLayout';

const longReflection = [
  '## Core Shift',
  '',
  'The dream gathers a quiet pressure at the shoreline, where distance keeps asking for a crossing.',
  '',
  'A second movement follows: the body remembers the cold water before the mind names it.',
  '',
  '## Reflective Questions',
  '',
  '- Where in the body does that shoreline still hold?',
  '- What would it mean to step one pace closer tomorrow?',
].join('\n');

const dream = {
  id: 'dream-1',
  date: '2025-04-01',
  title: 'Moon dream',
  content: 'I saw the moon over water.',
  symbol: 'moon',
  createdAt: '2025-04-01T00:00:00.000Z',
  updatedAt: '2025-04-01T00:00:00.000Z',
};

const interpretation = {
  id: 'interpretation-1',
  dreamId: 'dream-1',
  messages: [
    {
      id: 'm1',
      role: 'assistant',
      content: longReflection,
      timestamp: '2025-04-01T00:00:00.000Z',
    },
  ],
  symbols: ['moon'],
  archetypes: [],
  affects: ['wonder'],
  landscapes: ['moonlit water'],
  thresholds: ['shoreline'],
  relational_dynamics: [],
  motifs: [],
  central_conflicts: [],
  amplifications: [],
  symbol_stances: [],
  display_distillation: {
    essence_title: 'Moonlit distance',
    essence_line: 'The dream gathers around a quiet image of distance and reflection.',
    dominant_lens: 'image',
    visible_anchors: [
      { label: 'moon', type: 'image', salience: 5, ui_meaning: 'a quiet center of attention' },
    ],
    main_tension: 'distance vs contact',
    dream_movement: 'approaching',
    movement_line: 'The dream watches from a distance rather than crossing.',
  },
  dreamContentAtCreation: dream.content,
  createdAt: '2025-04-01T00:00:00.000Z',
  updatedAt: '2025-04-01T00:00:00.000Z',
};

describe('DreamDetail exploring chat scroll flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDreamById.mockResolvedValue(dream);
    mockGetInterpretationByDreamId.mockResolvedValue(interpretation);
    mockIsOnline.mockResolvedValue(true);
    mockSaveInterpretation.mockResolvedValue(undefined);
    mockUpdateInterpretationElementsFromConversation.mockImplementation(async (_dream, currentInterpretation) => currentInterpretation);
  });

  it('opens Exploring chat with the full multi-section reflection still in the tree', async () => {
    const screen = render(<DreamDetailScreen />);

    await waitFor(() => expect(screen.getByText('Continue exploring')).toBeTruthy());
    fireEvent.press(screen.getByText('Continue exploring'));

    await waitFor(() => expect(screen.getByText('Exploring the dream')).toBeTruthy());

    // Flattened markdown keeps section titles + later body/questions (not only Core Shift).
    expect(screen.getByText(/Core Shift/)).toBeTruthy();
    expect(
      screen.getByText(/A second movement follows: the body remembers the cold water/)
    ).toBeTruthy();
    expect(screen.getByText(/Reflective Questions/)).toBeTruthy();
    expect(screen.getByText(/Where in the body does that shoreline still hold/)).toBeTruthy();
    expect(screen.getByText(/What would it mean to step one pace closer tomorrow/)).toBeTruthy();
  });

  it('keeps the nested chat ScrollView scrollable (bounded height, nestedScroll, no overflow hidden)', async () => {
    const screen = render(<DreamDetailScreen />);

    await waitFor(() => expect(screen.getByText('Continue exploring')).toBeTruthy());
    fireEvent.press(screen.getByText('Continue exploring'));

    const chatScroll = await screen.findByTestId(DREAM_DETAIL_CHAT_SCROLL_TEST_ID);
    const flatStyle = StyleSheet.flatten(chatScroll.props.style) as Record<string, unknown>;

    expect(flatStyle.maxHeight).toBe(DREAM_DETAIL_CHAT_SCROLL_MAX_HEIGHT);
    expect(flatStyle.overflow).toBeUndefined();
    expect(chatScroll.props.nestedScrollEnabled).toBe(true);
    expect(chatScroll.props.scrollEnabled !== false).toBe(true);
  });

  it('shows the shared pending loader inside chat while a follow-up reply is in flight', async () => {
    let resolveReply: ((value: any) => void) | null = null;
    mockGenerateEntitledFollowupReply.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReply = resolve;
        })
    );

    const screen = render(<DreamDetailScreen />);

    await waitFor(() => expect(screen.getByText('Continue exploring')).toBeTruthy());
    fireEvent.press(screen.getByText('Continue exploring'));

    fireEvent.changeText(
      screen.getByPlaceholderText('Ask about an image, feeling, or pattern...'),
      'What is the water doing here?'
    );
    fireEvent.press(screen.getByTestId('dream-detail-send-button'));

    await waitFor(() => expect(screen.getByTestId('dream-detail-pending-reply-loader')).toBeTruthy());

    expect(resolveReply).not.toBeNull();
    resolveReply!({
      ...interpretation,
      messages: [
        ...interpretation.messages,
        {
          id: 'user-1',
          role: 'user',
          content: 'What is the water doing here?',
          timestamp: '2025-04-01T00:01:00.000Z',
        },
        {
          id: 'assistant-2',
          role: 'assistant',
          content: 'It seems to hold the distance in feeling, not just in image.',
          timestamp: '2025-04-01T00:01:03.000Z',
        },
      ],
    });

    await waitFor(() => expect(screen.queryByTestId('dream-detail-pending-reply-loader')).toBeNull());
  });

  it('does not force a second scroll-to-end when the follow-up reply arrives', async () => {
    mockGenerateEntitledFollowupReply.mockResolvedValue({
      ...interpretation,
      messages: [
        ...interpretation.messages,
        {
          id: 'user-1',
          role: 'user',
          content: 'What is the water doing here?',
          timestamp: '2025-04-01T00:01:00.000Z',
        },
        {
          id: 'assistant-2',
          role: 'assistant',
          content: 'It seems to hold the distance in feeling, not just in image.',
          timestamp: '2025-04-01T00:01:03.000Z',
        },
      ],
    });

    const screen = render(<DreamDetailScreen />);

    await waitFor(() => expect(screen.getByText('Continue exploring')).toBeTruthy());
    fireEvent.press(screen.getByText('Continue exploring'));

    fireEvent.changeText(
      screen.getByPlaceholderText('Ask about an image, feeling, or pattern...'),
      'What is the water doing here?'
    );
    fireEvent.press(screen.getByTestId('dream-detail-send-button'));

    await waitFor(() => expect(mockGenerateEntitledFollowupReply).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockChatScrollToEnd).toHaveBeenCalledTimes(1));
  });

  it('hides the pending loader as soon as assistant typing begins', async () => {
    let resolveReply: ((value: any) => void) | null = null;
    let releasePostProcessing: (() => void) | null = null;

    mockGenerateEntitledFollowupReply.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReply = resolve;
        })
    );
    mockUpdateInterpretationElementsFromConversation.mockImplementation(
      () =>
        new Promise((resolve) => {
          releasePostProcessing = () => resolve(interpretation);
        })
    );

    const screen = render(<DreamDetailScreen />);

    await waitFor(() => expect(screen.getByText('Continue exploring')).toBeTruthy());
    fireEvent.press(screen.getByText('Continue exploring'));

    fireEvent.changeText(
      screen.getByPlaceholderText('Ask about an image, feeling, or pattern...'),
      'What is the water doing here?'
    );
    fireEvent.press(screen.getByTestId('dream-detail-send-button'));

    await waitFor(() => expect(screen.getByTestId('dream-detail-pending-reply-loader')).toBeTruthy());

    expect(resolveReply).not.toBeNull();
    resolveReply!({
      ...interpretation,
      messages: [
        ...interpretation.messages,
        {
          id: 'user-1',
          role: 'user',
          content: 'What is the water doing here?',
          timestamp: '2025-04-01T00:01:00.000Z',
        },
        {
          id: 'assistant-2',
          role: 'assistant',
          content: 'It seems to hold the distance in feeling, not just in image.',
          timestamp: '2025-04-01T00:01:03.000Z',
        },
      ],
    });

    await waitFor(() => expect(screen.queryByTestId('dream-detail-pending-reply-loader')).toBeNull());

    expect(releasePostProcessing).not.toBeNull();
    releasePostProcessing!();
  });
});
