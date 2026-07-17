/**
 * Flow coverage: documentation/flows-05-sync-offline.md (offline guard for InterpretationChat AI actions).
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockSetOptions = jest.fn();
const mockGetDreamById = jest.fn();
const mockGetInterpretationByDreamId = jest.fn();
const mockIsOnline = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    setOptions: mockSetOptions,
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: { dreamId: 'dream-1' },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../src/components/ui', () => ({
  BreathingLine: () => null,
  ThreadDrift: () => null,
  LoadingState: ({ preset }: any) => {
    const { Text } = require('react-native');
    return <Text>{preset}</Text>;
  },
  PaperBackground: ({ children }: any) => children,
  DesignExportForeground: ({ children }: any) => children,
  PrimaryIconButton: ({ onPress, accessibilityLabel }: any) => {
    const React = require('react');
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} accessibilityLabel={accessibilityLabel}>
        <Text>{accessibilityLabel ?? 'icon button'}</Text>
      </TouchableOpacity>
    );
  },
}));

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
  };
});

jest.mock('../../src/utils/storage', () => ({
  getDreamById: (...args: unknown[]) => mockGetDreamById(...args),
  getInterpretationByDreamId: (...args: unknown[]) => mockGetInterpretationByDreamId(...args),
  saveInterpretation: jest.fn(),
  deleteInterpretation: jest.fn(),
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

jest.mock('../../src/utils/network', () => ({
  isOnline: (...args: unknown[]) => mockIsOnline(...args),
}));

import InterpretationChatScreen from '../../src/screens/InterpretationChatScreen';

const dream = {
  id: 'dream-1',
  date: '2025-04-01',
  title: 'Moon dream',
  content: 'I saw the moon over water.',
  symbol: 'moon',
  createdAt: '2025-04-01T00:00:00.000Z',
  updatedAt: '2025-04-01T00:00:00.000Z',
};

describe('InterpretationChat offline message flow', () => {
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

  it('shows the offline message when initial interpretation generation requires internet', async () => {
    const screen = render(<InterpretationChatScreen />);

    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Ask about symbols/i)).toBeTruthy()
    );

    expect(await screen.findByText("You're Offline")).toBeTruthy();
    expect(
      screen.getByText(/Jungian AI chat requires an internet connection/i)
    ).toBeTruthy();
  });
});
