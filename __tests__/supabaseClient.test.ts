jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => 'client'),
}));

describe('supabaseClient', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('throws when env is missing', () => {
    jest.doMock('expo-constants', () => ({
      expoConfig: { extra: {} },
      manifest: { extra: {} },
    }));

    expect(() => require('../src/services/supabaseClient')).toThrow(
      /Supabase configuration missing/
    );
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

