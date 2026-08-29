/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md and
 * documentation/flows-07-insights-reports.md.
 *
 * Contract validation is observation-only. It must not delay or replace the
 * established reflection stream, trigger a contract retry, or persist raw
 * user/model text as validator telemetry.
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');
const read = (rel: string) => readFileSync(path.join(repoRoot, rel), 'utf8');

describe('reflective contract shadow validation flow', () => {
  const billingAi = read('supabase/functions/_shared/billing-ai.ts');
  const gateway = read('supabase/functions/ai-entitlements-gateway/index.ts');
  const entitledAi = read('src/services/entitledAiService.ts');
  const dreamDetail = read('src/screens/DreamDetailScreen.tsx');
  const observation = read('src/ai/reflectiveContractObservation.ts');
  const clientAi = read('src/services/ai.ts');

  it('keeps live partial streaming and the ~15s progressive reveal unchanged', () => {
    expect(billingAi).toMatch(/async function invokeOpenAiProxyStream/);
    expect(billingAi).toMatch(/await params\.onProgress\?\.\(\{/);
    expect(gateway).toMatch(/onProgress: async \(progress\)/);
    expect(gateway).toMatch(/partial_reflection: progress\.text/);
    expect(entitledAi).toMatch(/REFLECTION_PARTIAL_REVEAL_AFTER_MS = 15000/);
    expect(dreamDetail).toMatch(/REFLECTION_PARTIAL_REVEAL_AFTER_MS/);
    expect(dreamDetail).toMatch(/<PhasedTypingText/);
  });

  it('observes only completed outputs and never gates their delivery', () => {
    expect(billingAi.indexOf('await params.onProgress?.({ text: finalText')).toBeLessThan(
      billingAi.indexOf('const contractValidation = observeReflectiveContractFailOpen({')
    );
    expect(observation).toMatch(/Observes a completed response without changing, rejecting, or regenerating it/);
    expect(observation).not.toMatch(/raw_(?:text|content)|generated_text|user_text/);
    expect(billingAi).not.toMatch(/same_call_(?:reading|chat|essay)_contract_invalid/);
    expect(billingAi).not.toMatch(/same-call whole-reading retry start/);
    expect(billingAi).not.toMatch(/follow-up whole-response retry start/);
    expect(clientAi).not.toMatch(/ai_same_call_(?:reading|chat)_contract_invalid/);
    expect(clientAi).not.toMatch(/ai_pattern_essay_question_contract_invalid/);
  });

  it('isolates observer exceptions from delivery and retries', () => {
    expect(observation).toMatch(/export function safeObserveReflectiveContract/);
    expect(observation).toMatch(/try \{[\s\S]*observeReflectiveContract[\s\S]*\} catch \(error\) \{/);
    expect(observation).toMatch(/passed: null/);
    expect(observation).toMatch(/observation_error: true/);
    expect(observation).toMatch(/observation_error_code: REFLECTIVE_CONTRACT_OBSERVATION_ERROR_CODE/);
    expect(billingAi).toMatch(/observeReflectiveContractFailOpen/);
    expect(billingAi).toMatch(/reflective contract shadow observer error/);
    expect(billingAi).not.toMatch(/\n\s*observeReflectiveContract\(\{/);
    expect(clientAi).toMatch(/safeObserveReflectiveContract/);
    expect(clientAi).not.toMatch(/\n\s*observeReflectiveContract\(\{/);
  });

  it('persists compact structured observations beside existing model/latency telemetry', () => {
    expect(observation).toMatch(/oneiros-same-call-shadow-v1\.0\.1/);
    for (const field of [
      'passed',
      'issues',
      'validation_version',
      'surface',
      'question_count',
      'expected_question_count',
      'detected_language',
      'expected_language',
      'answer_menu_detected',
      'observation_error',
      'observation_error_code',
    ]) {
      expect(observation).toContain(field);
    }
    expect(gateway.match(/contract_validation:/g)?.length).toBe(4);
    expect(gateway).toMatch(/observed_at: new Date\(\)\.toISOString\(\)/);
    expect(gateway).toMatch(/reflection_ai_ms/);
    expect(gateway).toMatch(/chat_followup_ai_ms/);
    expect(gateway).toMatch(/recent_dream_field_ai_ms/);
    expect(gateway).toMatch(/period_reflection_ai_ms/);
  });

  it('keeps essay recovery operational-only: incomplete or over-length', () => {
    expect(billingAi).toMatch(/if \(!primaryIncomplete && !primaryTooLong\)/);
    expect(billingAi).toMatch(/retryReason: primaryIncomplete \? 'incomplete' : 'length_overflow'/);
    expect(billingAi).not.toMatch(/retryReason:[\s\S]{0,180}'question_structure'/);
    expect(clientAi).not.toMatch(/initialQuestionInvalid/);
  });
});
