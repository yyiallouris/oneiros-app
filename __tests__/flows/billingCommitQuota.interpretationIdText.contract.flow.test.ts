/**
 * Flow coverage: documentation/flows-10-subscriptions-billing.md
 * + flows-06 follow-up chat
 *
 * Regression: dream_followup_reply failed with "Failed to commit quota" because
 * billing_commit_quota cast interpretation_id to uuid while interpretations.id is text.
 */
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');
const migrationsDir = path.join(repoRoot, 'supabase/migrations');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

function latestBillingCommitQuotaSql(): string {
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
  let latest = '';
  for (const file of files) {
    const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
    if (/CREATE OR REPLACE FUNCTION billing_commit_quota\b/i.test(sql)) {
      latest = sql;
    }
  }
  if (!latest) {
    throw new Error('No billing_commit_quota migration found');
  }
  // Isolate the latest function body roughly.
  const start = latest.lastIndexOf('CREATE OR REPLACE FUNCTION billing_commit_quota');
  return latest.slice(start);
}

describe('billing_commit_quota interpretation id text contract', () => {
  it('keeps interpretation_id as text (never uuid) in the latest commit RPC', () => {
    const commitFn = latestBillingCommitQuotaSql();
    const gateway = read('supabase/functions/ai-entitlements-gateway/index.ts');
    const flowBilling = read('documentation/flows-10-subscriptions-billing.md');
    const migrationsReadme = read('supabase/migrations/README.md');
    const skill = read('.codex/skills/oneiros-repo/SKILL.md');

    expect(commitFn).toMatch(/v_interpretation_id text/);
    expect(commitFn).toMatch(/v_context_interpretation_id text/);
    expect(commitFn).not.toMatch(/v_interpretation_id uuid/);
    expect(commitFn).not.toMatch(/interpretation_id'\)\),\s*''\)\)::uuid/);
    expect(commitFn).toMatch(/dream_followup_reply/);
    expect(commitFn).toMatch(/chat_replies_used/);

    // Follow-up must persist chat turns only after successful quota commit.
    expect(gateway).toMatch(/Persist messages only after quota commit succeeds/);
    expect(gateway).toMatch(/next_messages/);

    expect(flowBilling).toMatch(/billing_commit_quota/);
    expect(flowBilling).toMatch(/interpretation_id` as \*\*text\*\*/);
    expect(migrationsReadme).toMatch(/20260725150000_fix_billing_commit_quota_interpretation_id_text/);
    expect(skill).toMatch(/billing_commit_quota/);
    expect(skill).toMatch(/interpretation_id` as text/);
  });
});
