import fs from 'fs';
import { ONEIROS_V1_DESIGN_RELEASE } from '../src/theme';
import {
  computeDesignReleaseFingerprint,
  listDesignReleaseFiles,
  verifyDesignReleaseFingerprint,
} from '../scripts/lib/designReleaseFingerprint';

describe('Oneiros v1 design release', () => {
  it('identifies the complete approved v1 visual and UX baseline', () => {
    expect(ONEIROS_V1_DESIGN_RELEASE).toMatchObject({
      id: 'oneiros-design-v1.0.1',
      productLine: 'oneiros-v1',
      status: 'final',
      approvedOn: '2026-09-02',
      appVersionAtApproval: '1.2.0',
      scope: 'complete-app-visual-ux',
      fingerprintAlgorithm: 'sha256-path-null-bytes-v1',
    });
  });

  it('matches the exact active visual source and asset fingerprint', () => {
    const files = listDesignReleaseFiles();

    expect(files).toContain('App.tsx');
    expect(files).toContain('src/navigation/MainTabsNavigator.tsx');
    expect(files).toContain('src/theme/colors.ts');
    expect(files).toContain('src/assets/icons/action_icons/calendar_date_leaf_ink_v1.png');
    expect(files.some((file) => file.includes('/legacy/'))).toBe(false);
    expect(computeDesignReleaseFingerprint()).toBe(ONEIROS_V1_DESIGN_RELEASE.sourceFingerprint);
    expect(verifyDesignReleaseFingerprint().matches).toBe(true);
  });

  it('surfaces the design release in Expo metadata without changing the app version', () => {
    const appConfig = fs.readFileSync('app.config.js', 'utf8');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
      version: string;
    };

    expect(packageJson.version).toBe(ONEIROS_V1_DESIGN_RELEASE.appVersionAtApproval);
    expect(appConfig).toContain(`version: '${ONEIROS_V1_DESIGN_RELEASE.appVersionAtApproval}'`);
    expect(appConfig).toContain(`designRelease: '${ONEIROS_V1_DESIGN_RELEASE.id}'`);
  });
});
