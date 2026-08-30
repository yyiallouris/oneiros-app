import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('support delivery contract', () => {
  const contactService = read('src/services/contact.ts');
  const supportService = read('src/services/supportRequest.ts');
  const supportFunction = read('supabase/functions/support-request/index.ts');

  it('routes signed-in contact through the shared edge function instead of direct RLS insert', () => {
    expect(contactService).toContain('sendSupportRequest({');
    expect(contactService).not.toContain("from('contact_messages')");
    expect(supportService).toContain("functions.invoke('support-request'");
  });

  it('keeps destination ownership and authenticated persistence on the server', () => {
    expect(supportFunction).toContain('const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL")');
    expect(supportFunction).toContain('resolveAuthenticatedUser(req)');
    expect(supportFunction).toContain('/rest/v1/contact_messages');
    expect(supportFunction).toContain('target_email: SUPPORT_EMAIL');
    expect(supportFunction).not.toContain('body.target_email');
  });

  it('uses Resend with reply routing and no legacy Postmark dependency', () => {
    expect(supportFunction).toContain('https://api.resend.com/emails');
    expect(supportFunction).toContain('reply_to: email');
    expect(supportFunction).toContain('reply_to: SUPPORT_EMAIL');
    expect(supportFunction).not.toContain('POSTMARK');
  });

  it('keeps authenticated persistence best-effort and adds privacy-safe failure tracing', () => {
    expect(supportFunction).toContain('Delivery is the product contract');
    expect(supportFunction).toContain('request_id: requestId');
    expect(supportFunction).toContain('stage');
    expect(supportFunction).toContain('persisted');
  });

  it('does not expose the support destination in the mobile app config', () => {
    const appConfig = read('app.config.js');
    expect(appConfig).not.toContain('EXPO_PUBLIC_CONTACT_EMAIL');
    expect(appConfig).not.toContain('contactEmail:');
  });
});
