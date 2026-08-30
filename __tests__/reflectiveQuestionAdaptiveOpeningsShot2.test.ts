import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import {
  buildInitialReflectionRequest,
  SAME_CALL_QUESTION_SAFEGUARDS,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  SAME_CALL_STANDARD_ADVANCED_QUESTIONS,
} from '../src/ai/dreamReflectionPrompt';
import {
  ADAPTIVE_OPENINGS_SHOT2_BUNDLE,
  ADAPTIVE_OPENINGS_SHOT2_BUNDLE_SHA256,
  ADAPTIVE_OPENINGS_SHOT2_FULL_INSTRUCTION,
  ADAPTIVE_OPENINGS_SHOT2_METHOD_ID,
  ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION,
  ADAPTIVE_OPENINGS_SHOT2_STATUS,
  buildAdaptiveOpeningsShot2Request,
  SHOT2_ENACTED_OPENING_JOB,
  SHOT2_IMAGINAL_OPENING_JOB,
  SHOT2_PRIVATE_FULL_ROUTE,
} from '../src/ai/rd/reflective-questions/adaptiveOpeningsShot2Candidate';
import { PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2 } from '../src/ai/rd/reflective-questions/adaptiveOpeningsCandidate';
import { V103_ENACTED_RELATION_Q1 } from '../src/ai/rd/reflective-questions/v103EnactedRelationCandidate';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES,
  hashReflectiveQuestionPrompt,
} from '../src/ai/reflectiveQuestionProductionHold';

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(
  repoRoot,
  'testing/reflective-questions/adaptive-openings-shot2-2026-08-29.json'
);
const manifestSha = '8bcbf82848d6ebec1217817e30a87a5378cd12fdd432e62bb2d3765a76a19245';
const dream = {
  title: 'Neutral jobs',
  date: '2026-08-29',
  content: 'My sister opened the gate. A blue feather remained on the path.',
};

describe('Adaptive Reflective Openings Shot 2', () => {
  it('is frozen as undeployable Shot 2 while production remains v1.0.3', () => {
    expect(ADAPTIVE_OPENINGS_SHOT2_STATUS).toBe('frozen_shot_2_of_3');
    expect(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256).toBe(
      'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7'
    );
    expect(DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES).toContainEqual({
      methodId: ADAPTIVE_OPENINGS_SHOT2_METHOD_ID,
      promptSha256: ADAPTIVE_OPENINGS_SHOT2_BUNDLE_SHA256,
    });
    expect(hashReflectiveQuestionPrompt(ADAPTIVE_OPENINGS_SHOT2_BUNDLE)).toBe(
      ADAPTIVE_OPENINGS_SHOT2_BUNDLE_SHA256
    );
  });

  it('changes slot ownership, not the enacted/imaginal composition bodies', () => {
    expect(SHOT2_ENACTED_OPENING_JOB.replace(
      '- Enacted opening composition job:',
      '- Question 1 — enacted relation:'
    )).toBe(V103_ENACTED_RELATION_Q1);
    expect(SHOT2_IMAGINAL_OPENING_JOB
      .replace(
        '- Imaginal opening composition job:',
        '- Question 2 — symbolic / relational / imaginal:'
      )
      .replace(
        'An imaginal opening may be psychologically or symbolically suggestive.',
        'The second question may be more psychologically or symbolically suggestive than the first.'
      )
    ).toBe(PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2);
    expect(ADAPTIVE_OPENINGS_SHOT2_FULL_INSTRUCTION).toContain(
      SAME_CALL_QUESTION_SAFEGUARDS
    );
    expect(ADAPTIVE_OPENINGS_SHOT2_FULL_INSTRUCTION).not.toMatch(/Question [12]/u);
    expect(ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION).not.toMatch(/Question [12]/u);
  });

  it('pins one private route decision without adding prohibitions or machinery', () => {
    expect(SHOT2_PRIVATE_FULL_ROUTE).toContain(
      'choose exactly one route: ENACTED_ONLY, IMAGINAL_ONLY, or BOTH'
    );
    expect(SHOT2_PRIVATE_FULL_ROUTE).toContain('Never fill an unselected slot.');
    expect(SHOT2_PRIVATE_FULL_ROUTE).not.toMatch(/judge|repair|retry|rerank|composer|gate/iu);
  });

  it.each(['quick', 'standard', 'advanced'] as const)(
    'keeps Reader/model/language parity for %s',
    (depth) => {
      const production = buildInitialReflectionRequest(dream, depth);
      const candidate = buildAdaptiveOpeningsShot2Request(dream, depth);
      expect(candidate.task).toBe(production.task);
      expect(candidate.temperature).toBe(production.temperature);
      expect(candidate.tokenLimit).toBe(production.tokenLimit);
      expect(candidate.reflectiveLanguageContext).toEqual(
        production.reflectiveLanguageContext
      );
      expect(candidate.messages.filter((_, index) => index !== 2 && index !== 4)).toEqual(
        production.messages.filter((_, index) => index !== 2 && index !== 4)
      );
      expect(candidate.messages[2].content).not.toBe(production.messages[2].content);
      expect(candidate.messages[4].content).not.toBe(production.messages[4].content);
      if (depth !== 'quick') {
        expect(candidate.messages[2].content).not.toContain(
          SAME_CALL_STANDARD_ADVANCED_QUESTIONS
        );
      }
    }
  );

  it('pins the same 10 dreams, Shot 1 evidence, and cumulative remaining budget', () => {
    const manifestRaw = readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestRaw) as {
      shot: number;
      maximum_total_shots: number;
      candidate: { method_id: string; bundle_sha256: string };
      frozen_dataset: { sha256: string };
      shot_1_evidence: { reviewed_sha256: string };
      scope: { planned_calls: number; retries: number; deployments: number };
      cumulative_budget_from_shot_2: {
        hard_cap_usd: number;
        shot_2_reserved_packet_usd: number;
      };
      gate: { shot_3_required_by_owner: boolean; no_fourth_candidate: boolean };
    };
    expect(createHash('sha256').update(manifestRaw).digest('hex')).toBe(manifestSha);
    expect(manifest).toMatchObject({
      shot: 2,
      maximum_total_shots: 3,
      candidate: {
        method_id: ADAPTIVE_OPENINGS_SHOT2_METHOD_ID,
        bundle_sha256: ADAPTIVE_OPENINGS_SHOT2_BUNDLE_SHA256,
      },
      frozen_dataset: {
        sha256: '4b361245bc58ab7856d0ad48421f2b6f8c25a5d5e11fadb5275b83c6f1312d71',
      },
      shot_1_evidence: {
        reviewed_sha256: '2d7b7ee34b6bfdd8a68294df1eeb7fe77ab639d0512ab92e07df707e0063d850',
      },
      scope: { planned_calls: 20, retries: 0, deployments: 0 },
      cumulative_budget_from_shot_2: {
        hard_cap_usd: 1,
        shot_2_reserved_packet_usd: 0.55,
      },
      gate: { shot_3_required_by_owner: true, no_fourth_candidate: true },
    });
    const runner = readFileSync(
      path.join(repoRoot, 'scripts/live/reflective-questions/run-adaptive-openings-shot2.ts'),
      'utf8'
    );
    expect(runner).toContain('ONEIROS_ADAPTIVE_OPENINGS_SHOT2_COST_APPROVED');
    expect(runner).toContain(manifestSha);
    expect(runner).toContain('EXPECTED_CALLS = 20');
    expect(runner).toContain('CUMULATIVE_SHOT2_SHOT3_CAP_USD = 1');
    expect(runner).not.toMatch(/normalizeCompletedReflectiveQuestionStructure/);
  });
});
