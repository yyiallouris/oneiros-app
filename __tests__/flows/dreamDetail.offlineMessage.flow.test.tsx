/**
 * Flow coverage: documentation/flows-05-sync-offline.md (offline guard for DreamDetail AI actions).
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform, TouchableOpacity } from 'react-native';

const mockSetOptions = jest.fn();
const mockGetDreamById = jest.fn();
const mockGetInterpretationByDreamId = jest.fn();
const mockIsOnline = jest.fn();

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
    WaveBackground: ({ children }: any) => <View>{children}</View>,
    MountainWaveBackground: ({ children }: any) => <View>{children}</View>,
    PsycheScreenBackground: ({ children }: any) => <View>{children}</View>,
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
    LinoSkeletonCard: () => null,
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
  saveInterpretation: jest.fn(),
  deleteInterpretation: jest.fn(),
  saveDream: jest.fn(),
}));

jest.mock('../../src/services/ai', () => ({
  generateInitialInterpretation: jest.fn(),
  sendChatMessage: jest.fn(),
  filterArchetypesForDisplay: (value: string[]) => value,
  updateInterpretationElementsFromConversation: jest.fn(async (_dream, interpretation) => interpretation),
}));

jest.mock('../../src/services/dreamMetadataPrefetchService', () => ({
  getDreamMetadataForReflection: jest.fn(),
  prefetchDreamMetadata: jest.fn(),
}));

jest.mock('../../src/services/userSettingsService', () => ({
  getInterpretationDepth: jest.fn().mockResolvedValue('standard'),
}));

jest.mock('../../src/services/userSettingsService', () => ({
  ...jest.requireActual('../../src/services/userSettingsService'),
  getMythicResonance: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../src/utils/network', () => ({
  isOnline: (...args: unknown[]) => mockIsOnline(...args),
}));

jest.mock('../../src/constants/symbolArchetypeInfo', () => ({
  ARCHETYPE_SECTION_TITLES: {
    core: 'Inner structures',
    dynamic: 'Archetypal energies',
  },
  getArchetypeInfoKey: jest.fn(),
}));

import DreamDetailScreen from '../../src/screens/DreamDetailScreen';

const dream = {
  id: 'dream-1',
  date: '2025-04-01',
  title: 'Moon dream',
  content: 'I saw the moon over water.',
  symbol: 'moon',
  createdAt: '2025-04-01T00:00:00.000Z',
  updatedAt: '2025-04-01T00:00:00.000Z',
};

const dreamWithTags = {
  ...dream,
  symbols: ['stale moon'],
  archetypes: ['Shadow'],
};

const interpretation = {
  id: 'interpretation-1',
  dreamId: 'dream-1',
  messages: [
    {
      id: 'm1',
      role: 'assistant',
      content: 'A first reflection on the dream.',
      timestamp: '2025-04-01T00:00:00.000Z',
    },
  ],
  symbols: ['moon'],
  archetypes: ['shadow'],
  affects: ['wonder'],
  landscapes: ['moonlit water'],
  thresholds: ['shoreline'],
  relational_dynamics: ['watching from a distance'],
  motifs: ['light over water'],
  central_conflicts: ['distance vs contact'],
  amplifications: ['moon over water'],
  symbol_stances: [{ symbol: 'moon', stance: 'quietly luminous' }],
  display_distillation: {
    essence_title: 'Moonlit distance',
    essence_line: 'The dream gathers around a quiet image of distance and reflection.',
    dominant_lens: 'image',
    visible_anchors: [
      { label: 'moon', type: 'image', salience: 5, ui_meaning: 'a quiet center of attention' },
      { label: 'water', type: 'image', salience: 4, ui_meaning: 'a reflective surface' },
    ],
    main_tension: 'distance vs contact',
    dream_movement: 'approaching',
    movement_line: 'The dream watches from a distance rather than crossing.',
  },
  dreamContentAtCreation: dream.content,
  createdAt: '2025-04-01T00:00:00.000Z',
  updatedAt: '2025-04-01T00:00:00.000Z',
};

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('DreamDetail offline message flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetDreamById.mockResolvedValue(dream);
    mockGetInterpretationByDreamId.mockResolvedValue(null);
    mockIsOnline.mockResolvedValue(false);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows the offline message when reflect is pressed without connectivity', async () => {
    const screen = render(<DreamDetailScreen />);

    await waitFor(() => expect(screen.getByText('Reflect on this dream')).toBeTruthy());

    fireEvent.press(screen.getByText('Reflect on this dream'));

    await act(async () => {
      jest.advanceTimersByTime(850);
      await flushMicrotasks();
    });

    expect(await screen.findByText("You're Offline")).toBeTruthy();
    expect(
      screen.getByText(/Jungian AI interpretation requires an internet connection/i)
    ).toBeTruthy();
  });

  it('shows the offline chat message when sending a follow-up while offline', async () => {
    mockGetInterpretationByDreamId.mockResolvedValue(interpretation);

    const screen = render(<DreamDetailScreen />);

    await waitFor(() => expect(screen.getByText('Continue exploring')).toBeTruthy());

    fireEvent.press(screen.getByText('Continue exploring'));

    const input = await screen.findByPlaceholderText('Ask about an image, feeling, or pattern...');
    fireEvent.changeText(input, 'What is this dream asking of me?');

    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[touchables.length - 1]);

    await act(async () => {
      await flushMicrotasks();
    });

    expect(await screen.findByText("You're Offline")).toBeTruthy();
    expect(
      screen.getByText(/Jungian AI chat requires an internet connection/i)
    ).toBeTruthy();
  });

  it('renders the sanctuary summary instead of top-level ontology chips', async () => {
    mockGetDreamById.mockResolvedValue(dreamWithTags);
    mockGetInterpretationByDreamId.mockResolvedValue(interpretation);

    const screen = render(<DreamDetailScreen />);

    expect(await screen.findByText('Dream essence')).toBeTruthy();
    expect(screen.getByText('Moonlit distance')).toBeTruthy();
    expect(screen.getByText('Key anchors')).toBeTruthy();
    expect(screen.getByText('Inner movement')).toBeTruthy();
    expect(screen.getByText('distance vs contact')).toBeTruthy();
    expect(screen.getAllByText('Symbolic reflection').length).toBeGreaterThan(0);
    expect(screen.getByText('Explore symbolic layers')).toBeTruthy();
    expect(screen.queryByText('Symbols')).toBeNull();
    expect(screen.queryByText('Inner structures')).toBeNull();
    expect(screen.queryByText('Archetypal energies')).toBeNull();
  });

  it('keeps symbolic layers collapsed until opened', async () => {
    mockGetInterpretationByDreamId.mockResolvedValue(interpretation);

    const screen = render(<DreamDetailScreen />);

    await screen.findByText('Explore symbolic layers');
    expect(screen.queryByText('Emotional weather')).toBeNull();

    fireEvent.press(screen.getByText('Explore symbolic layers'));

    expect(await screen.findByText('Emotional weather')).toBeTruthy();
    expect(screen.getByText('wonder')).toBeTruthy();
  });

  it.each(['ios', 'android'] as const)('renders the sanctuary summary on %s', async (os) => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
    mockGetInterpretationByDreamId.mockResolvedValue(interpretation);

    const screen = render(<DreamDetailScreen />);

    expect(await screen.findByText('Dream essence')).toBeTruthy();
    fireEvent.press(screen.getByText('Continue exploring'));
    expect(screen.getByPlaceholderText('Ask about an image, feeling, or pattern...')).toBeTruthy();

    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  });

  it('shows reflection-focused loading copy while generating', async () => {
    mockIsOnline.mockResolvedValue(true);
    const ai = require('../../src/services/ai');
    ai.generateInitialInterpretation.mockReturnValue(new Promise(() => {}));

    const screen = render(<DreamDetailScreen />);

    await waitFor(() => expect(screen.getByText('Reflect on this dream')).toBeTruthy());
    fireEvent.press(screen.getByText('Reflect on this dream'));

    await act(async () => {
      jest.advanceTimersByTime(850);
      await flushMicrotasks();
    });

    expect(await screen.findByText('Reflecting on your dream...')).toBeTruthy();
    expect(screen.getByText('Tracing its images, feelings, and inner movement.')).toBeTruthy();
  });
});
