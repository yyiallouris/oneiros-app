const supportHandler = require('../../api/support.js');

type MockResponse = {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  setHeader: jest.Mock;
  status: jest.Mock;
  json: jest.Mock;
};

function createResponse(): MockResponse {
  const response = {
    statusCode: 200,
    body: undefined,
    headers: {},
    setHeader: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  } as MockResponse;

  response.setHeader.mockImplementation((name: string, value: string) => {
    response.headers[name] = value;
  });
  response.status.mockImplementation((statusCode: number) => {
    response.statusCode = statusCode;
    return response;
  });
  response.json.mockImplementation((body: unknown) => {
    response.body = body;
    return response;
  });

  return response;
}

describe('public support web delivery', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'public-anon-key',
    };
    global.fetch = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('forwards a valid same-origin request to the canonical support function', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });
    const response = createResponse();

    await supportHandler(
      {
        method: 'POST',
        headers: { origin: 'https://www.oneirosjournal.com' },
        body: {
          email: ' dreamer@example.com ',
          subject: ' Help\nplease ',
          message: ' Something happened. ',
          company: '',
        },
      },
      response
    );

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.supabase.co/functions/v1/support-request',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          apikey: 'public-anon-key',
          Authorization: 'Bearer public-anon-key',
        }),
        body: JSON.stringify({
          email: 'dreamer@example.com',
          subject: 'Help please',
          message: 'Something happened.',
        }),
      })
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('rejects invalid input without contacting Supabase', async () => {
    const response = createResponse();

    await supportHandler(
      {
        method: 'POST',
        headers: { origin: 'https://oneirosjournal.com' },
        body: { email: 'not-an-email', message: '' },
      },
      response
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });

  it('silently absorbs honeypot submissions', async () => {
    const response = createResponse();

    await supportHandler(
      {
        method: 'POST',
        headers: { origin: 'https://oneirosjournal.com' },
        body: {
          email: 'bot@example.com',
          message: 'Spam',
          company: 'Automated Company',
        },
      },
      response
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('rejects browser requests from an unrelated origin', async () => {
    const response = createResponse();

    await supportHandler(
      {
        method: 'POST',
        headers: { origin: 'https://example.com' },
        body: { email: 'dreamer@example.com', message: 'Help' },
      },
      response
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
  });

  it('fails safely when the upstream support function rejects delivery', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 502 });
    const response = createResponse();

    await supportHandler(
      {
        method: 'POST',
        headers: { origin: 'https://oneirosjournal.com' },
        body: { email: 'dreamer@example.com', message: 'Help' },
      },
      response
    );

    expect(response.statusCode).toBe(502);
    expect(response.body).toEqual({ error: 'Could not send support request' });
  });
});
