jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => 'client'),
}));

describe('supabaseClient', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('throws when env is missing', () => {
    const savedUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const savedKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;

    jest.doMock('expo-constants', () => ({
      expoConfig: { extra: {} },
      manifest: { extra: {} },
    }));

    try {
      expect(() => require('../src/services/supabaseClient')).toThrow(
        /Supabase configuration missing/
      );
    } finally {
      if (savedUrl !== undefined) process.env.EXPO_PUBLIC_SUPABASE_URL = savedUrl;
      if (savedKey !== undefined) process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = savedKey;
    }
  });

  it('creates client when env present', () => {
    jest.doMock('expo-constants', () => ({
      expoConfig: {
        extra: {
          supabaseUrl: 'https://example.supabase.co',
          supabaseAnonKey: 'anon',
        },
      },
    }));

    const { supabase } = require('../src/services/supabaseClient');
    expect(supabase).toBe('client');
  });
});

