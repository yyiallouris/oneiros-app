const mockGetUser = jest.fn();
const mockInvoke = jest.fn();
const mockLogEvent = jest.fn();
const mockLogError = jest.fn();

jest.mock('../src/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

jest.mock('../src/services/logger', () => ({
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
  logError: (...args: unknown[]) => mockLogError(...args),
}));

import { sendContactMessage } from '../src/services/contact';

describe('sendContactMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes an authenticated contact request through the support edge function', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'dreamer@example.com' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });

    await sendContactMessage({ subject: '  Account help  ', message: '  Please help me.  ' });

    expect(mockInvoke).toHaveBeenCalledWith('support-request', {
      body: {
        email: 'dreamer@example.com',
        subject: 'Account help',
        message: 'Please help me.',
      },
    });
    expect(mockLogEvent).toHaveBeenCalledWith('contact_message_sent', {
      userId: 'user-1',
      hasEmail: true,
    });
  });

  it('fails before invoking the backend when the account has no email', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: null } },
      error: null,
    });

    await expect(
      sendContactMessage({ subject: '', message: 'Please help me.' })
    ).rejects.toThrow('A signed-in account with an email address is required.');

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('propagates edge-function delivery failures to the support form', async () => {
    const invokeError = new Error('support unavailable');
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'dreamer@example.com' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({ data: null, error: invokeError });

    await expect(
      sendContactMessage({ subject: '', message: 'Please help me.' })
    ).rejects.toBe(invokeError);
  });
});
