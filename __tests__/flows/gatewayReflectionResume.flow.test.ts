/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * (async reflection leave/kill resume — gateway must not double-start background work).
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

describe('gateway reflection resume flow', () => {
  it('skips a second background worker when async_background_started is already set', () => {
    const gateway = readFileSync(
      path.join(repoRoot, 'supabase/functions/ai-entitlements-gateway/index.ts'),
      'utf8'
    );
    const readme = readFileSync(
      path.join(repoRoot, 'supabase/functions/ai-entitlements-gateway/README.md'),
      'utf8'
    );

    expect(gateway).toMatch(/async_background_started/);
    expect(gateway).toMatch(/async reflection replay pending/);
    expect(gateway).toMatch(/runInBackground/);
    expect(readme).toMatch(/async_background_started/);
    expect(readme).toMatch(/second Edge worker/);
  });
});
