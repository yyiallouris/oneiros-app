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
  buildV104ImaginalHandoffInitialRequest,
  V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2,
  V104_IMAGINAL_HANDOFF_BUNDLE,
  V104_IMAGINAL_HANDOFF_BUNDLE_SHA256,
  V104_IMAGINAL_HANDOFF_CANDIDATE_STATUS,
  V104_IMAGINAL_HANDOFF_METHOD_ID,
  V104_IMAGINAL_HANDOFF_METHOD_VERSION,
  V104_IMAGINAL_HANDOFF_Q2,
  V104_IMAGINAL_HANDOFF_READER_PROMPT_ID,
  V104_IMAGINAL_HANDOFF_READER_PROMPT_VERSION,
} from '../src/ai/rd/reflective-questions/v104ImaginalHandoffCandidate';

const repoRoot = path.resolve(__dirname, '..');
const fixturePath = path.join(
  repoRoot,
  'testing/reflective-questions/v1.0.4-imaginal-handoff-evaluation-2026-08-29.json'
);
const fixtureSha =
  'ec7becc8f382399c1bab1d50edbce4c3568b468e17ab5edd124131987147a211';
const reviewedResultsPath = path.join(
  repoRoot,
  'testing/reflective-questions/artifacts/v1.0.4-imaginal-handoff-evaluation-2026-08-29/REVIEWED_RESULTS.json'
);

describe('frozen v1.0.4 imaginal-handoff Q2 candidate', () => {
  it('keeps production pinned to the approved v1.0.3 artifact', () => {
    expect(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION).toEqual({
      methodId: 'oneiros-same-call-reflective-questions-v1.0.3-candidate',
      promptSha256: 'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
    });
    expect(V104_IMAGINAL_HANDOFF_CANDIDATE_STATUS).toBe(
      'human_quality_hold_after_one_frozen_evaluation'
    );
    expect(DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES).toContainEqual({
      methodId: V104_IMAGINAL_HANDOFF_METHOD_ID,
      promptSha256: V104_IMAGINAL_HANDOFF_BUNDLE_SHA256,
    });
  });

  it.each(['standard', 'advanced'] as const)(
    'changes only the Q2 composition block in the %s model request',
    (depth) => {
      const dream = {
        title: 'Frozen request parity',
        date: '2026-08-29',
        content: 'I held a door while my sister crossed. When she turned, the door stayed open by itself.',
      };
      const production = buildInitialReflectionRequest(dream, depth);
      const candidate = buildV104ImaginalHandoffInitialRequest(dream, depth);

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
      expect(candidate.messages[2].content).toContain(V104_IMAGINAL_HANDOFF_Q2);
      expect(candidate.messages[2].content).not.toContain(
        V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2
      );
      expect(
        candidate.messages[2].content.replace(
          V104_IMAGINAL_HANDOFF_Q2,
          V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2
        )
      ).toBe(production.messages[2].content);
    }
  );

  it('contains the exact approved positive composition job and no new safeguard stack', () => {
    expect(V104_IMAGINAL_HANDOFF_Q2).toBe(`- Question 2 — imaginal handoff:
  Return to one unresolved imaginal configuration already explicit in the dream and made salient by the reading.
  Hold it in the event, relation, or juxtaposition the dream itself stages, and ask one open question that carries its tension forward while leaving the next symbolic connection for the dreamer to make.`);
    expect(V104_IMAGINAL_HANDOFF_Q2).not.toMatch(/for example|e\.g\.|such as/iu);
    expect(V104_IMAGINAL_HANDOFF_Q2).not.toContain('final symbolic connection');
    expect(V104_IMAGINAL_HANDOFF_BUNDLE).toContain(SAME_CALL_QUESTION_SAFEGUARDS);
    expect(V104_IMAGINAL_HANDOFF_BUNDLE).not.toContain(
      'Never supply candidate answer vocabulary'
    );
    expect(V104_IMAGINAL_HANDOFF_BUNDLE.split(V104_IMAGINAL_HANDOFF_Q2)).toHaveLength(4);
  });

  it('pins the exact candidate bundle while remaining reversible to v1.0.3', () => {
    expect(hashReflectiveQuestionPrompt(V104_IMAGINAL_HANDOFF_BUNDLE)).toBe(
      V104_IMAGINAL_HANDOFF_BUNDLE_SHA256
    );
    const reverted = V104_IMAGINAL_HANDOFF_BUNDLE
      .replace(V104_IMAGINAL_HANDOFF_METHOD_ID, SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID)
      .replace(
        V104_IMAGINAL_HANDOFF_METHOD_VERSION,
        SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_VERSION
      )
      .replace(V104_IMAGINAL_HANDOFF_READER_PROMPT_ID, DREAM_REFLECTION_PROMPT_ID)
      .replace(
        V104_IMAGINAL_HANDOFF_READER_PROMPT_VERSION,
        DREAM_REFLECTION_PROMPT_VERSION
      )
      .split(V104_IMAGINAL_HANDOFF_Q2)
      .join(V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2);
    expect(reverted).toBe(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE);
  });

  it('pins the sealed 21-case fixture and one-run paid gate', () => {
    const fixtureRaw = readFileSync(fixturePath, 'utf8');
    const fixture = JSON.parse(fixtureRaw) as {
      candidate: { method_id: string; bundle_sha256: string };
      scope: { planned_calls: number; hard_cost_cap_usd: number };
      known_q2_failures: string[];
      strong_q2_controls: string[];
      sealed_unseen_holdout: Array<{ language: string }>;
    };
    expect(createHash('sha256').update(fixtureRaw).digest('hex')).toBe(fixtureSha);
    expect(fixture.candidate).toEqual({
      method_id: V104_IMAGINAL_HANDOFF_METHOD_ID,
      bundle_sha256: V104_IMAGINAL_HANDOFF_BUNDLE_SHA256,
      reader_prompt_id: V104_IMAGINAL_HANDOFF_READER_PROMPT_ID,
    });
    expect(fixture.scope.planned_calls).toBe(21);
    expect(fixture.scope.hard_cost_cap_usd).toBe(1);
    expect(fixture.known_q2_failures).toHaveLength(3);
    expect(fixture.strong_q2_controls).toHaveLength(6);
    expect(fixture.sealed_unseen_holdout).toHaveLength(12);
    expect(new Set(fixture.sealed_unseen_holdout.map((item) => item.language)).size).toBe(12);

    const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['benchmark:reflective-v104-imaginal-handoff']).toContain(
      'run-v104-imaginal-handoff-evaluation.ts'
    );
    const runner = readFileSync(
      path.join(
        repoRoot,
        'scripts/live/reflective-questions/run-v104-imaginal-handoff-evaluation.ts'
      ),
      'utf8'
    );
    expect(runner).toContain('ONEIROS_V104_IMAGINAL_HANDOFF_COST_APPROVED');
    expect(runner).toContain(fixtureSha);
    expect(runner).toContain('HARD_COST_CAP_USD = 1');
    expect(runner).not.toContain('semantic judge');
  });

  it('records the completed frozen evaluation as HOLD without moving production', () => {
    const reviewed = JSON.parse(readFileSync(reviewedResultsPath, 'utf8')) as {
      status: string;
      candidate_method: string;
      candidate_sha256: string;
      fixture_sha256: string;
      exact_cost_usd: number;
      results: unknown[];
      human_summary: {
        q2_individual: { pass: number; fail: number };
        pair_complementarity: { pass: number; fail: number };
        q1_regression: { pass: number; fail: number };
        known_q2_failures_repaired: number;
        strong_controls_equivalent: number;
        unseen_holdout_q2_pass: number;
        structural_hard_failures: number;
        recommendation: string;
      };
    };

    expect(reviewed).toMatchObject({
      status: 'complete',
      candidate_method: V104_IMAGINAL_HANDOFF_METHOD_ID,
      candidate_sha256: V104_IMAGINAL_HANDOFF_BUNDLE_SHA256,
      fixture_sha256: fixtureSha,
      exact_cost_usd: 0.316805,
      human_summary: {
        q2_individual: { pass: 17, fail: 4 },
        pair_complementarity: { pass: 21, fail: 0 },
        q1_regression: { pass: 20, fail: 1 },
        known_q2_failures_repaired: 2,
        strong_controls_equivalent: 5,
        unseen_holdout_q2_pass: 10,
        structural_hard_failures: 0,
        recommendation: 'HOLD',
      },
    });
    expect(reviewed.results).toHaveLength(21);
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId).not.toBe(
      V104_IMAGINAL_HANDOFF_METHOD_ID
    );
  });
});
