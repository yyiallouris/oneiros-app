/**
 * Flow coverage: documentation/flows-05-sync-offline.md (offline guard for DreamDetail AI actions).
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';

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
  extractDreamSymbolsAndArchetypes: jest.fn(),
  filterArchetypesForDisplay: (value: string[]) => value,
}));

jest.mock('../../src/services/userSettingsService', () => ({
  getInterpretationDepth: jest.fn().mockResolvedValue('standard'),
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
  summary: 'A short summary',
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

    await waitFor(() => expect(screen.getByText('Reflect')).toBeTruthy());

    fireEvent.press(screen.getByText('Reflect'));

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

    await waitFor(() => expect(screen.getByText('Expand conversation')).toBeTruthy());

    fireEvent.press(screen.getByText('Expand conversation'));
    fireEvent.press(await screen.findByText('Continue exploring'));

    const input = await screen.findByPlaceholderText('Ask about symbols, feelings, or patterns...');
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
});
