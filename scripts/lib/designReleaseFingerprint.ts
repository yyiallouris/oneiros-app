import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { ONEIROS_V1_DESIGN_RELEASE } from '../../src/theme/designRelease';

export const DESIGN_RELEASE_SOURCE_ROOTS = [
  'App.tsx',
  'app.config.js',
  'assets/backgrounds',
  'assets/branding',
  'src/assets/icons',
  'src/components',
  'src/layout',
  'src/navigation',
  'src/screens',
  'src/theme',
] as const;

const INCLUDED_EXTENSIONS = new Set([
  '.jpeg',
  '.jpg',
  '.json',
  '.png',
  '.svg',
  '.ts',
  '.tsx',
  '.webp',
]);

const isFrozenDesignSource = (relativePath: string): boolean => {
  const normalizedPath = relativePath.split(path.sep).join('/');
  const segments = normalizedPath.split('/');

  if (segments.includes('legacy')) return false;
  if (normalizedPath === 'src/theme/designRelease.ts') return false;

  return INCLUDED_EXTENSIONS.has(path.extname(normalizedPath).toLowerCase());
};

const collectFiles = (rootDirectory: string, relativePath: string): string[] => {
  const absolutePath = path.join(rootDirectory, relativePath);
  const stat = fs.statSync(absolutePath);

  if (stat.isFile()) return isFrozenDesignSource(relativePath) ? [relativePath] : [];

  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .flatMap((entry) => {
      const childPath = path.join(relativePath, entry.name);
      if (entry.isDirectory() && entry.name === 'legacy') return [];
      if (entry.isDirectory() && entry.name === 'review') return [];
      // Candidate assets are review-only and must not mutate the fingerprint
      // of the currently active, product-approved design release. Once a
      // candidate is approved, its directory loses the `-candidate` suffix
      // and becomes part of the next active release fingerprint.
      if (entry.isDirectory() && entry.name.endsWith('-candidate')) return [];
      return entry.isDirectory()
        ? collectFiles(rootDirectory, childPath)
        : isFrozenDesignSource(childPath)
          ? [childPath]
          : [];
    });
};

export const listDesignReleaseFiles = (rootDirectory = process.cwd()): string[] =>
  DESIGN_RELEASE_SOURCE_ROOTS.flatMap((sourceRoot) => collectFiles(rootDirectory, sourceRoot))
    .map((relativePath) => relativePath.split(path.sep).join('/'))
    .sort();

export const computeDesignReleaseFingerprint = (rootDirectory = process.cwd()): string => {
  const digest = createHash('sha256');

  listDesignReleaseFiles(rootDirectory).forEach((relativePath) => {
    digest.update(relativePath, 'utf8');
    digest.update('\0');
    digest.update(fs.readFileSync(path.join(rootDirectory, relativePath)));
    digest.update('\0');
  });

  return digest.digest('hex');
};

export const verifyDesignReleaseFingerprint = (rootDirectory = process.cwd()) => {
  const actual = computeDesignReleaseFingerprint(rootDirectory);
  const expected = ONEIROS_V1_DESIGN_RELEASE.candidateSourceFingerprint
    ?? ONEIROS_V1_DESIGN_RELEASE.sourceFingerprint;

  return { actual, expected, matches: actual === expected };
};

if (require.main === module) {
  const result = verifyDesignReleaseFingerprint();
  if (!result.matches) {
    process.stderr.write(
      `Oneiros design release fingerprint mismatch.\nExpected: ${result.expected}\nActual:   ${result.actual}\n`,
    );
    process.exitCode = 1;
  } else {
    const sourceKind = ONEIROS_V1_DESIGN_RELEASE.candidateSourceFingerprint
      ? 'integrated review'
      : ONEIROS_V1_DESIGN_RELEASE.reviewCheckpoint
        ? 'approved source with review-only candidate'
        : 'approved';
    process.stdout.write(
      `${ONEIROS_V1_DESIGN_RELEASE.id} ${sourceKind} source verified: ${result.actual}\n`,
    );
  }
}
