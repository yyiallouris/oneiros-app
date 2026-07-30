/**
 * Flow coverage: public legal website required for App Store / Play Store review.
 */
import fs from 'fs';
import path from 'path';

const siteRoot = path.join(__dirname, '../../site');

function readSiteFile(relativePath: string): string {
  return fs
    .readFileSync(path.join(siteRoot, relativePath), 'utf8')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

describe('public legal site', () => {
  it('provides public landing, privacy, and terms pages for oneirosjournal.com', () => {
    expect(fs.existsSync(path.join(siteRoot, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(siteRoot, 'privacy/index.html'))).toBe(true);
    expect(fs.existsSync(path.join(siteRoot, 'terms/index.html'))).toBe(true);
    expect(fs.existsSync(path.join(siteRoot, 'support/index.html'))).toBe(true);
    expect(fs.existsSync(path.join(siteRoot, 'assets/oneiros_logo.png'))).toBe(true);
    expect(fs.existsSync(path.join(siteRoot, 'sitemap.xml'))).toBe(true);

    expect(readSiteFile('index.html')).toContain('/assets/oneiros_logo.png');
    expect(readSiteFile('index.html')).toContain('clear boundaries for a private dream journal');
    expect(readSiteFile('index.html')).toContain('privacy');
    expect(readSiteFile('index.html')).toContain('terms');
    expect(readSiteFile('index.html')).toContain('support');
  });

  it('keeps the privacy page aligned with sensitive dream, AI, voice, support, and deletion disclosures', () => {
    const privacy = readSiteFile('privacy/index.html');

    expect(privacy).toContain('dream journal');
    expect(privacy).toContain('sensitive personal information');
    expect(privacy).toContain('voice recordings');
    expect(privacy).toContain('openai');
    expect(privacy).toContain('anthropic');
    expect(privacy).toContain('supabase');
    expect(privacy).toContain('deletion');
    expect(privacy).toContain('support@oneirosjournal.com');
  });

  it('keeps the terms page aligned with adult-only, non-clinical, AI, and acceptable-use boundaries', () => {
    const terms = readSiteFile('terms/index.html');

    expect(terms).toContain('at least 18');
    expect(terms).toContain('not therapy');
    expect(terms).toContain('diagnosis');
    expect(terms).toContain('crisis support');
    expect(terms).toContain('ai-generated output');
    expect(terms).toContain('acceptable use');
    expect(terms).toContain('premium');
    expect(terms).toContain('deeper');
    expect(terms).toContain('apple app store');
    expect(terms).toContain('google play');
    expect(terms).toContain('support@oneirosjournal.com');
  });

  it('provides a public support page for store listing and account data requests', () => {
    const support = readSiteFile('support/index.html');

    expect(support).toContain('email support');
    expect(support).toContain('account deletion');
    expect(support).toContain('data deletion');
    expect(support).toContain('export');
    expect(support).toContain('crisis support');
    expect(support).toContain('support@oneirosjournal.com');
  });
});
