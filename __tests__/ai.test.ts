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

function apiResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null as string | null },
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

describe('ai service', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns interpretation when API succeeds', async () => {
    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [{ message: { content: 'Analysis result' } }],
      })
    );

    const result = await generateInitialInterpretation({
      id: '1',
      title: 'Test',
      date: '2024-01-01',
      content: 'Dream text',
      archived: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });

    expect(result).toBe('Analysis result');
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('throws when API key missing', async () => {
    jest.resetModules();
    jest.doMock('expo-constants', () => ({
      expoConfig: { extra: { openaiApiKey: '' } },
    }));
    const { generateInitialInterpretation: generateWithMissingKey } = require('../src/services/ai');

    await expect(
      generateWithMissingKey({
        id: '1',
        title: 'Test',
        date: '2024-01-01',
        content: 'Dream text',
        archived: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      })
    ).rejects.toThrow(/OpenAI API key/);
  });
});

