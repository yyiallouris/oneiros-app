/**
 * Flow coverage: documentation/flows-10-subscriptions-billing.md
 *
 * Manual/test entitlements can raise the paid dream-reflection cycle limit via
 * subscription_entitlements.raw.dream_reflection_limit (default stays 60).
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

describe('billing dream reflection limit override contract', () => {
  it('reads raw.dream_reflection_limit in reserve + status RPCs and documents the grant script', () => {
    const migration = read(
      'supabase/migrations/20260727010000_billing_dream_reflection_limit_override.sql'
    );
    const grant = read('scripts/sql/grant-test-user-200-dreams.sql');
    const flowBilling = read('documentation/flows-10-subscriptions-billing.md');
    const migrationsReadme = read('supabase/migrations/README.md');

    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION billing_paid_dream_reflection_limit/);
    expect(migration).toMatch(/dream_reflection_limit/);
    expect(migration).toMatch(/v_limit := billing_paid_dream_reflection_limit\(v_ent\.raw\)/);
    expect(migration).toMatch(
      /v_dream_limit := billing_paid_dream_reflection_limit\(v_ent\.raw\)/
    );
    expect(migration).toMatch(/ON CONFLICT \(bucket_key\) DO UPDATE/);
    expect(migration).toMatch(/v_limit := 10/);

    expect(grant).toMatch(/yyiallouris@gmail\.com/);
    expect(grant).toMatch(/dream_reflection_limit/);
    expect(grant).toMatch(/v_limit integer := 200/);
    expect(grant).toMatch(/paid_monthly/);

    expect(flowBilling).toMatch(/raw\.dream_reflection_limit/);
    expect(flowBilling).toMatch(/grant-test-user-200-dreams\.sql/);
    expect(migrationsReadme).toMatch(/20260727010000_billing_dream_reflection_limit_override/);
  });
});
