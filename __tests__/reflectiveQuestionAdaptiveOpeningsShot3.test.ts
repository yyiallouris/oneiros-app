import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import { SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID } from '../src/ai/dreamReflectionPrompt';
import {
  ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION,
  buildAdaptiveOpeningsShot2Request,
  SHOT2_NEUTRAL_COMPOSITION_JOBS,
} from '../src/ai/rd/reflective-questions/adaptiveOpeningsShot2Candidate';
import {
  ADAPTIVE_OPENINGS_SHOT3_BUNDLE,
  ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256,
  ADAPTIVE_OPENINGS_SHOT3_FULL_INSTRUCTION,
  ADAPTIVE_OPENINGS_SHOT3_METHOD_ID,
  ADAPTIVE_OPENINGS_SHOT3_STATUS,
  buildAdaptiveOpeningsShot3Request,
  SHOT3_MINIMUM_SUFFICIENT_SELECTION,
} from '../src/ai/rd/reflective-questions/adaptiveOpeningsShot3Candidate';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES,
  hashReflectiveQuestionPrompt,
} from '../src/ai/reflectiveQuestionProductionHold';

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(
  repoRoot,
  'testing/reflective-questions/adaptive-openings-shot3-final-2026-08-29.json'
);
const manifestSha = '48dd4a0066c3579bc20a4400680dd76843d2f85a27d299947636fb992d762b03';
const dream = {
  title: 'Minimum sufficient',
  date: '2026-08-29',
  content: 'My sister opened the gate. A blue feather remained on the path.',
};

describe('Adaptive Reflective Openings final Shot 3', () => {
  it('freezes the third and final candidate without moving production', () => {
    expect(ADAPTIVE_OPENINGS_SHOT3_STATUS).toBe('frozen_final_shot_3_of_3');
    expect(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256).toBe(
      'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7'
    );
    expect(hashReflectiveQuestionPrompt(ADAPTIVE_OPENINGS_SHOT3_BUNDLE)).toBe(
      ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256
    );
    expect(DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES).toContainEqual({
      methodId: ADAPTIVE_OPENINGS_SHOT3_METHOD_ID,
      promptSha256: ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256,
    });
  });

  it('uses an asymmetric minimum-sufficient boundary and closes the line', () => {
    expect(SHOT3_MINIMUM_SUFFICIENT_SELECTION).toContain(
      'Treat that one question as a complete Reflective Questions section by default.'
    );
    expect(SHOT3_MINIMUM_SUFFICIENT_SELECTION).toContain(
      'If either requirement is absent or uncertain, stop at one.'
    );
    expect(SHOT3_MINIMUM_SUFFICIENT_SELECTION).toContain(
      'one explicit dream source and one direction of attention'
    );
    expect(ADAPTIVE_OPENINGS_SHOT3_FULL_INSTRUCTION).toContain(
      SHOT2_NEUTRAL_COMPOSITION_JOBS
    );
    expect(ADAPTIVE_OPENINGS_SHOT3_FULL_INSTRUCTION).not.toMatch(/Question [12]/u);
    expect(ADAPTIVE_OPENINGS_SHOT3_BUNDLE).toContain('shot-3-final-no-fourth-candidate');
  });

  it('keeps Quick byte-identical to Shot 2 and changes only full selection', () => {
    const shot2Quick = buildAdaptiveOpeningsShot2Request(dream, 'quick');
    const shot3Quick = buildAdaptiveOpeningsShot3Request(dream, 'quick');
    expect(shot3Quick).toEqual(shot2Quick);
    expect(shot3Quick.messages[2].content).toContain(
      ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION
    );
    const shot2Full = buildAdaptiveOpeningsShot2Request(dream, 'standard');
    const shot3Full = buildAdaptiveOpeningsShot3Request(dream, 'standard');
    expect(shot3Full.task).toBe(shot2Full.task);
    expect(shot3Full.temperature).toBe(shot2Full.temperature);
    expect(shot3Full.tokenLimit).toBe(shot2Full.tokenLimit);
    expect(shot3Full.reflectiveLanguageContext).toEqual(
      shot2Full.reflectiveLanguageContext
    );
    expect(shot3Full.messages.filter((_, index) => index !== 2 && index !== 4)).toEqual(
      shot2Full.messages.filter((_, index) => index !== 2 && index !== 4)
    );
    expect(shot3Full.messages[2].content).not.toBe(shot2Full.messages[2].content);
  });

  it('pins the final 10-call scope and cumulative Shot 2 + Shot 3 cap', () => {
    const manifestRaw = readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestRaw) as {
      shot: number;
      maximum_total_shots: number;
      shot_2_evidence: { reviewed_sha256: string; exact_cost_usd: number };
      scope: { planned_calls: number; quick_calls: number; retries: number };
      cumulative_budget_from_shot_2: {
        hard_cap_usd: number;
        exact_spend_before_shot_3_usd: number;
        remaining_before_shot_3_usd: number;
        shot_3_reserved_packet_usd: number;
      };
      gate: { absolute_stop_after_this_shot: boolean; no_fourth_candidate: boolean };
    };
    expect(createHash('sha256').update(manifestRaw).digest('hex')).toBe(manifestSha);
    expect(manifest).toMatchObject({
      shot: 3,
      maximum_total_shots: 3,
      shot_2_evidence: {
        reviewed_sha256: '45c8450d19fd6db3ce5e45b8cb2c0c7660867f4af07eb21b36217c0c20e3abc2',
        exact_cost_usd: 0.225755,
      },
      scope: { planned_calls: 10, quick_calls: 0, retries: 0 },
      cumulative_budget_from_shot_2: {
        hard_cap_usd: 1,
        exact_spend_before_shot_3_usd: 0.225755,
        remaining_before_shot_3_usd: 0.774245,
        shot_3_reserved_packet_usd: 0.35,
      },
      gate: { absolute_stop_after_this_shot: true, no_fourth_candidate: true },
    });
    const runner = readFileSync(
      path.join(repoRoot, 'scripts/live/reflective-questions/run-adaptive-openings-shot3-final.ts'),
      'utf8'
    );
    expect(runner).toContain('ONEIROS_ADAPTIVE_OPENINGS_SHOT3_COST_APPROVED');
    expect(runner).toContain(manifestSha);
    expect(runner).toContain('EXPECTED_CALLS = 10');
    expect(runner).toContain('CUMULATIVE_CAP_USD = 1');
    expect(runner).toContain('fourth_candidate_permitted: false');
    expect(runner).not.toMatch(/normalizeCompletedReflectiveQuestionStructure/);
  });

  it('freezes the final HOLD evidence and closes the line without a fourth candidate', () => {
    const artifactDir = path.join(
      repoRoot,
      'testing/reflective-questions/artifacts/adaptive-openings-shot3-final-2026-08-29'
    );
    const evidence = [
      ['RAW_EVALUATION.json', '7efb14f81e4947c3e9af443fc52048d2897592e8c93104a06cfa6db17704d854'],
      ['HUMAN_VERDICTS.json', '6da1e03a564f9a8c11a560e26b68f59aed9acab78789626ada0e7e29c8823ba6'],
      ['REVIEWED_RESULTS.json', 'a136e3d13181f80bc1e63c4cdd0a5732861dfa208f6525f9d180fa1b49818252'],
    ] as const;
    for (const [file, expectedSha] of evidence) {
      expect(
        createHash('sha256').update(readFileSync(path.join(artifactDir, file))).digest('hex')
      ).toBe(expectedSha);
    }
    const reviewed = JSON.parse(
      readFileSync(path.join(artifactDir, 'REVIEWED_RESULTS.json'), 'utf8')
    ) as {
      human_summary: {
        full_target_and_product_pass: number;
        serious_failures: number;
        vitality_pass: number;
        exact_shot_3_cost_usd: number;
        cumulative_shot_2_shot_3_cost_usd: number;
        disposition: string;
      };
      manifest: { gate: { no_fourth_candidate: boolean; no_deploy: boolean } };
    };
    expect(reviewed.human_summary).toMatchObject({
      full_target_and_product_pass: 5,
      serious_failures: 3,
      vitality_pass: 10,
      exact_shot_3_cost_usd: 0.14549,
      cumulative_shot_2_shot_3_cost_usd: 0.371245,
      disposition: 'FINAL_SHOT_HOLD_EXPERIMENT_CLOSED',
    });
    expect(reviewed.manifest.gate).toMatchObject({
      no_fourth_candidate: true,
      no_deploy: true,
    });
  });
});
