import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

const releaseRoot = path.join(
  process.cwd(),
  'assets/branding/releases/v1.3.0',
);

const sha256 = (filePath: string): string =>
  createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');

describe('Oneiros 1.3.0 approved brand release', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(releaseRoot, 'manifest.json'), 'utf8'),
  ) as {
    releaseId: string;
    designReleaseId: string;
    targetAppVersion: string;
    status: string;
    sourcePolicy: string;
    sources: Record<string, { sha256: string }>;
    exports: Record<string, { sha256: string; hasAlpha: boolean }>;
  };

  it('locks the exact user-supplied source pixels', () => {
    expect(manifest).toMatchObject({
      releaseId: 'oneiros-brand-v1.3.0',
      designReleaseId: 'oneiros-design-v1.1.0',
      targetAppVersion: '1.3.0',
      status: 'approved-active',
      sourcePolicy: 'exact-user-supplied-pixels-no-generative-redraw',
    });

    for (const [fileName, expected] of Object.entries(manifest.sources)) {
      expect(sha256(path.join(releaseRoot, 'source', fileName))).toBe(expected.sha256);
    }
  });

  it('locks every deterministic platform export', () => {
    for (const [fileName, expected] of Object.entries(manifest.exports)) {
      expect(sha256(path.join(releaseRoot, 'exports', fileName))).toBe(expected.sha256);
    }

    expect(manifest.exports['icon-ios-1024.png'].hasAlpha).toBe(false);
    expect(manifest.exports['icon-android-background-1024.png'].hasAlpha).toBe(false);
  });

  it('activates the versioned assets without overwriting the frozen 1.2.0 files', () => {
    const appConfig = fs.readFileSync('app.config.js', 'utf8');
    expect(appConfig).toContain("version: '1.3.0'");
    expect(appConfig).toContain("designRelease: 'oneiros-design-v1.1.0'");
    expect(appConfig).toContain('assets/branding/releases/v1.3.0/exports/icon-ios-1024.png');
    expect(appConfig).toContain('assets/branding/releases/v1.3.0/exports/splash-symbol-master.png');
    expect(fs.existsSync('assets/branding/icon-ios.png')).toBe(true);
    expect(fs.existsSync('assets/branding/splash-lockup.png')).toBe(true);
  });

  it('keeps the public site on the same approved logo and favicon bytes', () => {
    expect(sha256('site/assets/oneiros_logo.png')).toBe(
      manifest.sources['oneiros-symbol-master.png'].sha256,
    );
    expect(sha256('site/assets/favicon.png')).toBe(
      manifest.exports['favicon-256.png'].sha256,
    );
  });
});
