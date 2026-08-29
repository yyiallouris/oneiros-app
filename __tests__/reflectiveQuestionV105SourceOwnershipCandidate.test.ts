import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import {
  buildInitialReflectionRequest,
  DREAM_REFLECTION_PROMPT_ID,
  DREAM_REFLECTION_PROMPT_VERSION,
  SAME_CALL_QUESTION_SAFEGUARDS,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_VERSION,
} from '../src/ai/dreamReflectionPrompt';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES,
  hashReflectiveQuestionPrompt,
} from '../src/ai/reflectiveQuestionProductionHold';
import { V103_ENACTED_RELATION_Q1 } from '../src/ai/rd/reflective-questions/v103EnactedRelationCandidate';
import {
  buildV105SourceOwnershipInitialRequest,
  V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2,
  V105_SOURCE_OWNERSHIP_BUNDLE,
  V105_SOURCE_OWNERSHIP_BUNDLE_SHA256,
  V105_SOURCE_OWNERSHIP_CANDIDATE_STATUS,
  V105_SOURCE_OWNERSHIP_METHOD_ID,
  V105_SOURCE_OWNERSHIP_METHOD_VERSION,
  V105_SOURCE_OWNERSHIP_Q2,
  V105_SOURCE_OWNERSHIP_READER_PROMPT_ID,
  V105_SOURCE_OWNERSHIP_READER_PROMPT_VERSION,
} from '../src/ai/rd/reflective-questions/v105SourceOwnershipCandidate';

const repoRoot = path.resolve(__dirname, '..');
const fixturePath = path.join(
  repoRoot,
  'testing/reflective-questions/v1.0.5-source-ownership-evaluation-2026-08-29.json'
);
const fixtureSha =
  'dd74ae0c3ccf5263b5baba4ceb8960c76ed4ec6890eb459ad19feea88f911da1';
const predecessorPath = path.join(
  repoRoot,
  'testing/reflective-questions/artifacts/v1.0.4-imaginal-handoff-evaluation-2026-08-29/REVIEWED_RESULTS.json'
);
const predecessorSha =
  'b2eaea9f804838419589b7f1ac2c463e6d6696609a09317c0c6866db5ddcca96';
const reviewedResultsPath = path.join(
  repoRoot,
  'testing/reflective-questions/artifacts/v1.0.5-source-ownership-evaluation-2026-08-29/REVIEWED_RESULTS.json'
);

describe('frozen v1.0.5 source-ownership Q2 candidate', () => {
  it('keeps production pinned and makes the evaluation candidate undeployable', () => {
    expect(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION).toEqual({
      methodId: 'oneiros-same-call-reflective-questions-v1.0.3-candidate',
      promptSha256: 'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
    });
    expect(V105_SOURCE_OWNERSHIP_CANDIDATE_STATUS).toBe(
      'human_quality_hold_stop_q2_rd'
    );
    expect(DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES).toContainEqual({
      methodId: V105_SOURCE_OWNERSHIP_METHOD_ID,
      promptSha256: V105_SOURCE_OWNERSHIP_BUNDLE_SHA256,
    });
  });

  it.each(['standard', 'advanced'] as const)(
    'changes only the Q2 composition block in the %s request',
    (depth) => {
      const dream = {
        title: 'Frozen source ownership parity',
        date: '2026-08-29',
        content: 'My sister held the bowl. I forgot the name written beneath it. The bowl continued to glow.',
      };
      const production = buildInitialReflectionRequest(dream, depth);
      const candidate = buildV105SourceOwnershipInitialRequest(dream, depth);

      expect(candidate.task).toBe(production.task);
      expect(candidate.temperature).toBe(production.temperature);
      expect(candidate.tokenLimit).toBe(production.tokenLimit);
      expect(candidate.reflectiveLanguageContext).toEqual(
        production.reflectiveLanguageContext
      );
      expect(candidate.messages).toHaveLength(production.messages.length);
      expect(candidate.messages.filter((_, index) => index !== 2)).toEqual(
        production.messages.filter((_, index) => index !== 2)
      );
      expect(candidate.messages[2].content).toContain(V103_ENACTED_RELATION_Q1);
      expect(candidate.messages[2].content).toContain(V105_SOURCE_OWNERSHIP_Q2);
      expect(candidate.messages[2].content).not.toContain(
        V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2
      );
      expect(
        candidate.messages[2].content.replace(
          V105_SOURCE_OWNERSHIP_Q2,
          V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2
        )
      ).toBe(production.messages[2].content);
    }
  );

  it('pins the exact positive ownership grammar without adding a safeguard stack', () => {
    expect(V105_SOURCE_OWNERSHIP_Q2).toBe(`- Question 2 — imaginal handoff:
  Return to one unresolved imaginal configuration explicitly present in the dream.
  Use the reading only to select the configuration; compose the question from the dream’s reported elements, preserving who or what each action or condition belongs to.
  Keep the question within that configuration and in the dream’s own concrete terms, with its direction still open to the dreamer.`);
    expect(V105_SOURCE_OWNERSHIP_Q2).not.toMatch(/for example|e\.g\.|such as/iu);
    expect(V105_SOURCE_OWNERSHIP_Q2).not.toContain('made salient by the reading');
    expect(V105_SOURCE_OWNERSHIP_Q2).not.toContain('carries its tension forward');
    expect(V105_SOURCE_OWNERSHIP_Q2).not.toContain('next symbolic association');
    expect(V105_SOURCE_OWNERSHIP_BUNDLE).toContain(SAME_CALL_QUESTION_SAFEGUARDS);
    expect(V105_SOURCE_OWNERSHIP_BUNDLE.split(V105_SOURCE_OWNERSHIP_Q2)).toHaveLength(4);
  });

  it('pins the candidate bundle and reverses exactly to production v1.0.3', () => {
    expect(hashReflectiveQuestionPrompt(V105_SOURCE_OWNERSHIP_BUNDLE)).toBe(
      V105_SOURCE_OWNERSHIP_BUNDLE_SHA256
    );
    const reverted = V105_SOURCE_OWNERSHIP_BUNDLE
      .replace(V105_SOURCE_OWNERSHIP_METHOD_ID, SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID)
      .replace(
        V105_SOURCE_OWNERSHIP_METHOD_VERSION,
        SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_VERSION
      )
      .replace(V105_SOURCE_OWNERSHIP_READER_PROMPT_ID, DREAM_REFLECTION_PROMPT_ID)
      .replace(
        V105_SOURCE_OWNERSHIP_READER_PROMPT_VERSION,
        DREAM_REFLECTION_PROMPT_VERSION
      )
      .split(V105_SOURCE_OWNERSHIP_Q2)
      .join(V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2);
    expect(reverted).toBe(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE);
  });

  it('pins the 22-case fixture, predecessor, strict gate, and one-run budget lock', () => {
    const fixtureRaw = readFileSync(fixturePath, 'utf8');
    const fixture = JSON.parse(fixtureRaw) as {
      candidate: { method_id: string; bundle_sha256: string; reader_prompt_id: string };
      evaluated_predecessor: { reviewed_artifact_sha256: string };
      scope: {
        planned_calls: number;
        hard_cost_cap_usd: number;
        conservative_reserved_packet_cost_usd: number;
      };
      acceptance_gate: {
        recovery_anchor_min_q2_pass: number;
        serious_control_regressions_allowed: number;
        q1_serious_regressions_allowed: number;
        recurring_failure_family_threshold: number;
        no_automatic_further_candidate: boolean;
      };
      v104_failure_recovery_anchors: string[];
      protected_v104_pass_controls: string[];
      sealed_unseen_holdout: Array<{ language: string }>;
    };

    expect(createHash('sha256').update(fixtureRaw).digest('hex')).toBe(fixtureSha);
    expect(createHash('sha256').update(readFileSync(predecessorPath, 'utf8')).digest('hex'))
      .toBe(predecessorSha);
    expect(fixture.candidate).toEqual({
      method_id: V105_SOURCE_OWNERSHIP_METHOD_ID,
      bundle_sha256: V105_SOURCE_OWNERSHIP_BUNDLE_SHA256,
      reader_prompt_id: V105_SOURCE_OWNERSHIP_READER_PROMPT_ID,
    });
    expect(fixture.evaluated_predecessor.reviewed_artifact_sha256).toBe(
      predecessorSha
    );
    expect(fixture.scope).toMatchObject({
      planned_calls: 22,
      hard_cost_cap_usd: 1,
      conservative_reserved_packet_cost_usd: 0.99,
    });
    expect(fixture.v104_failure_recovery_anchors).toHaveLength(4);
    expect(fixture.protected_v104_pass_controls).toHaveLength(6);
    expect(fixture.sealed_unseen_holdout).toHaveLength(12);
    expect(new Set(fixture.sealed_unseen_holdout.map((item) => item.language)).size)
      .toBe(12);
    expect(fixture.acceptance_gate).toMatchObject({
      recovery_anchor_min_q2_pass: 3,
      serious_control_regressions_allowed: 0,
      q1_serious_regressions_allowed: 0,
      recurring_failure_family_threshold: 2,
      no_automatic_further_candidate: true,
    });

    const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['benchmark:reflective-v105-source-ownership']).toContain(
      'run-v105-source-ownership-evaluation.ts'
    );
    const runner = readFileSync(
      path.join(
        repoRoot,
        'scripts/live/reflective-questions/run-v105-source-ownership-evaluation.ts'
      ),
      'utf8'
    );
    expect(runner).toContain('ONEIROS_V105_SOURCE_OWNERSHIP_COST_APPROVED');
    expect(runner).toContain(fixtureSha);
    expect(runner).toContain(predecessorSha);
    expect(runner).toContain('HARD_COST_CAP_USD = 1');
    expect(runner).toContain('EXPECTED_CALLS = 22');
  });

  it('records the final evaluation as HOLD and activates the Q2 stop condition', () => {
    const reviewed = JSON.parse(readFileSync(reviewedResultsPath, 'utf8')) as {
      status: string;
      candidate_method: string;
      candidate_sha256: string;
      fixture_sha256: string;
      exact_cost_usd: number;
      results: unknown[];
      human_summary: {
        q2_individual: { pass: number; fail: number };
        source_ownership: { pass: number; fail: number };
        pair_complementarity: { pass: number; fail: number };
        q1_regression: { pass: number; fail: number };
        recovery_anchors_repaired: number;
        protected_controls_equivalent: number;
        serious_control_regressions: number;
        hospital_v103_baseline_equivalent: boolean;
        unseen_holdout_q2_pass: number;
        unseen_holdout_pair_pass: number;
        structural_hard_failures: number;
        recommendation: string;
      };
    };

    expect(reviewed).toMatchObject({
      status: 'complete',
      candidate_method: V105_SOURCE_OWNERSHIP_METHOD_ID,
      candidate_sha256: V105_SOURCE_OWNERSHIP_BUNDLE_SHA256,
      fixture_sha256: fixtureSha,
      exact_cost_usd: 0.3353775,
      human_summary: {
        q2_individual: { pass: 17, fail: 5 },
        source_ownership: { pass: 20, fail: 2 },
        pair_complementarity: { pass: 22, fail: 0 },
        q1_regression: { pass: 20, fail: 2 },
        recovery_anchors_repaired: 3,
        protected_controls_equivalent: 4,
        serious_control_regressions: 1,
        hospital_v103_baseline_equivalent: true,
        unseen_holdout_q2_pass: 9,
        unseen_holdout_pair_pass: 12,
        structural_hard_failures: 0,
        recommendation: 'HOLD_STOP_Q2_RD',
      },
    });
    expect(reviewed.results).toHaveLength(22);
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId).not.toBe(
      V105_SOURCE_OWNERSHIP_METHOD_ID
    );
  });
});
