import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getPatternInsightLanguage,
  setPatternInsightLanguage,
} from '../src/services/patternInsightLanguageService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('pattern insight language settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns English when no saved language exists', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    await expect(getPatternInsightLanguage()).resolves.toBe('en');
  });

  it('reads a supported saved language', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('el');

    await expect(getPatternInsightLanguage()).resolves.toBe('el');
  });

  it('persists supported selections and ignores invalid values', async () => {
    await setPatternInsightLanguage('fr');
    await setPatternInsightLanguage('not-a-language');

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@pattern_insight_language', 'fr');
  });
});
