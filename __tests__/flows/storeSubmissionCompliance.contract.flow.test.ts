import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Apple and Google store submission compliance', () => {
  it('offers a discreet report action on every user-visible generative AI surface', () => {
    const detail = read('src/screens/DreamDetailScreen.tsx');
    const chat = read('src/screens/InterpretationChatScreen.tsx');
    const insights = read('src/screens/InsightsScreen.tsx');
    const period = read('src/screens/InsightsSectionScreen.tsx');
    const reportButton = read('src/components/ui/AiContentReportButton.tsx');

    expect(reportButton).toContain('Report this response');
    expect(reportButton).toContain('colors.textMuted');
    for (const source of [detail, chat, insights, period]) {
      expect(source).toContain('AiContentReportButton');
      expect(source).toContain("navigation.navigate('Contact'");
    }
  });

  it('keeps raw dream and AI output out of report route metadata', () => {
    const reportService = read('src/services/aiContentReport.ts');
    const contact = read('src/screens/ContactScreen.tsx');
    expect(reportService).toContain('referenceId');
    expect(reportService).not.toContain('dreamContent');
    expect(reportService).not.toContain('responseContent');
    expect(contact).toContain('not your dream or the response text');
  });

  it('blocks narrow prohibited follow-up requests on both client and gateway before quota work', () => {
    const client = read('src/services/entitledAiService.ts');
    const gateway = read('supabase/functions/ai-entitlements-gateway/index.ts');
    const followupBranch = gateway.slice(gateway.indexOf("if (body.action === 'dream_followup_reply')"));
    expect(client.indexOf('assertPermittedGenerativeRequest(message)'))
      .toBeLessThan(client.indexOf("action: 'dream_followup_reply'"));
    expect(followupBranch.indexOf('getGenerativeSafetyBlockReason(body.message)'))
      .toBeLessThan(followupBranch.indexOf('const interpretation = await getInterpretationById'));
  });

  it('shows automatic-renewal, cancellation, trial conversion, free alternative, and legal links before paid CTAs', () => {
    const card = read('src/components/subscription/SubscriptionPlanCard.tsx');
    const disclosure = read('src/components/subscription/SubscriptionPurchaseDisclosure.tsx');
    expect(disclosure).toContain('renews automatically');
    expect(disclosure).toContain('unless you cancel');
    expect(disclosure).toContain('Free remains available');
    expect(disclosure).toContain('Privacy Policy');
    expect(disclosure).toContain('Terms of Use');
    expect(card.indexOf('<SubscriptionPurchaseDisclosure'))
      .toBeLessThan(card.indexOf('{shouldHideAction ? null'));
  });

  it('secures an Apple refresh token and revokes Apple authorization before deleting data', () => {
    const auth = read('src/screens/AuthScreen.tsx');
    const tokenFunction = read('supabase/functions/apple-auth-token/index.ts');
    const deleteFunction = read('supabase/functions/delete-account/index.ts');
    const migration = read('supabase/migrations/20260902120000_create_apple_auth_tokens.sql');

    expect(auth).toContain("functions.invoke('apple-auth-token'");
    expect(tokenFunction).toContain('refresh_token: tokens.refresh_token');
    expect(migration).toContain('REVOKE ALL ON TABLE apple_auth_tokens FROM anon, authenticated');
    expect(deleteFunction.indexOf('revokeAppleAuthorization({'))
      .toBeLessThan(deleteFunction.indexOf('for (const table of USER_TABLES)'));
  });

  it('warns paid users that deletion does not cancel billing and offers store management', () => {
    const account = read('src/screens/AccountScreen.tsx');
    const support = read('site/support/index.html');
    expect(account).toContain('Subscription stays active');
    expect(account).toContain('Manage subscription');
    expect(account).toContain('Delete anyway');
    expect(support).toContain('Account deletion does not cancel an App Store or Google Play');
  });

  it('keeps production native config free of developer schemes and optional overlay/storage permissions', () => {
    const appConfig = read('app.config.js');
    const hardeningPlugin = read('plugins/withProductionStoreHardening.js');
    const easIgnore = read('.easignore');
    expect(appConfig).toContain("addGeneratedScheme: process.env.EAS_BUILD_PROFILE === 'development'");
    expect(appConfig).toContain("'android.permission.SYSTEM_ALERT_WINDOW'");
    expect(appConfig).toContain("'android.permission.READ_EXTERNAL_STORAGE'");
    expect(appConfig).toContain("'android.permission.WRITE_EXTERNAL_STORAGE'");
    expect(appConfig).toContain("buildNumber: '6'");
    expect(appConfig).toContain('versionCode: 6');
    expect(appConfig).toContain("'./plugins/withProductionStoreHardening'");
    expect(hardeningPlugin).toContain("const GENERATED_EXPO_SCHEME_PREFIX = 'exp+'");
    expect(hardeningPlugin).toContain('androidx.compose.ui.tooling.PreviewActivity');
    expect(hardeningPlugin).toContain('expo.modules.devlauncher.launcher.DevLauncherActivity');
    expect(hardeningPlugin).toContain("'tools:node': 'remove'");
    expect(easIgnore).toContain('store-submission/');
    expect(easIgnore).toContain('design-exports/');
    expect(easIgnore).not.toMatch(/^__mocks__\/$/m);
    expect(easIgnore).toContain('metro.config.js resolves production');
  });
});
