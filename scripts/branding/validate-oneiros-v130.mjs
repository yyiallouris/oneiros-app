import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repositoryRoot = process.cwd();
const releaseRoot = resolve(
  repositoryRoot,
  'assets/branding/releases/v1.3.0',
);
const manifest = JSON.parse(readFileSync(resolve(releaseRoot, 'manifest.json'), 'utf8'));

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const readPngHeader = (bytes) => {
  const signature = bytes.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    throw new Error('Asset is not a PNG');
  }

  const colorType = bytes.readUInt8(25);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    hasAlpha: colorType === 4 || colorType === 6,
  };
};

const verifyGroup = (directory, records) => {
  for (const [fileName, expected] of Object.entries(records)) {
    const filePath = resolve(releaseRoot, directory, fileName);
    const bytes = readFileSync(filePath);
    const actualHeader = readPngHeader(bytes);
    const actualHash = sha256(bytes);

    if (actualHash !== expected.sha256) {
      throw new Error(`${fileName}: SHA-256 mismatch`);
    }
    if (
      actualHeader.width !== expected.width
      || actualHeader.height !== expected.height
      || actualHeader.hasAlpha !== expected.hasAlpha
    ) {
      throw new Error(
        `${fileName}: expected ${expected.width}x${expected.height} alpha=${expected.hasAlpha}, `
          + `received ${actualHeader.width}x${actualHeader.height} alpha=${actualHeader.hasAlpha}`,
      );
    }
  }
};

verifyGroup('source', manifest.sources);
verifyGroup('exports', manifest.exports);

process.stdout.write(
  `${manifest.releaseId} verified: exact sources and ${Object.keys(manifest.exports).length} exports\n`,
);
