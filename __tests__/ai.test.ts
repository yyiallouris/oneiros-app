import { generateInitialInterpretation } from '../src/services/ai';

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      openaiApiKey: 'test-key',
      customGptEndpoint: null,
      gptModel: 'gpt-4o',
    },
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('ai service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns interpretation when API succeeds', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Analysis result' } }],
      }),
    });

    const result = await generateInitialInterpretation({
      id: '1',
      title: 'Test',
      date: '2024-01-01',
      content: 'Dream text',
      archived: false,
    });

    expect(result).toBe('Analysis result');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws when API key missing', () => {
    jest.resetModules();
    jest.doMock('expo-constants', () => ({
      expoConfig: { extra: { openaiApiKey: '' } },
    }));
    const { generateInitialInterpretation: generateWithMissingKey } = require('../src/services/ai');

    expect(() =>
      generateWithMissingKey({
        id: '1',
        title: 'Test',
        date: '2024-01-01',
        content: 'Dream text',
        archived: false,
      })
    ).rejects.toThrow('OpenAI API key not configured');
  });
});

