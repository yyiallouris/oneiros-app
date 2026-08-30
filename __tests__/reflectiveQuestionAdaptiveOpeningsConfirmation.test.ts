import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import {
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
} from '../src/ai/dreamReflectionPrompt';
import {
  ADAPTIVE_OPENINGS_SHOT3_BUNDLE,
  ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256,
  ADAPTIVE_OPENINGS_SHOT3_METHOD_ID,
} from '../src/ai/rd/reflective-questions/adaptiveOpeningsShot3Candidate';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
  hashReflectiveQuestionPrompt,
} from '../src/ai/reflectiveQuestionProductionHold';

const root = path.resolve(__dirname, '..');
const paths = {
  fixture: path.join(
    root,
    'testing/reflective-questions/adaptive-openings-shot3-vs-production-confirmation-2026-08-30.json'
  ),
  rubric: path.join(
    root,
    'testing/reflective-questions/ADAPTIVE_OPENINGS_SHOT3_VS_PRODUCTION_BLIND_RUBRIC_2026-08-30.md'
  ),
  key: path.join(
    root,
    'testing/reflective-questions/artifacts/adaptive-openings-shot3-vs-production-confirmation-2026-08-30/BLIND_KEY.json'
  ),
  seal: path.join(
    root,
    'testing/reflective-questions/artifacts/adaptive-openings-shot3-vs-production-confirmation-2026-08-30/SEAL.json'
  ),
  raw: path.join(
    root,
    'testing/reflective-questions/artifacts/adaptive-openings-shot3-vs-production-confirmation-2026-08-30/RAW_PAIRED_OUTPUTS.json'
  ),
  blindPacket: path.join(
    root,
    'testing/reflective-questions/artifacts/adaptive-openings-shot3-vs-production-confirmation-2026-08-30/BLIND_REVIEW_PACKET.md'
  ),
  verdicts: path.join(
    root,
    'testing/reflective-questions/artifacts/adaptive-openings-shot3-vs-production-confirmation-2026-08-30/BLIND_HUMAN_VERDICTS.json'
  ),
  reviewed: path.join(
    root,
    'testing/reflective-questions/artifacts/adaptive-openings-shot3-vs-production-confirmation-2026-08-30/REVIEWED_RESULTS.json'
  ),
  report: path.join(
    root,
    'testing/reflective-questions/artifacts/adaptive-openings-shot3-vs-production-confirmation-2026-08-30/REVIEW_REPORT.md'
  ),
  priorFixture: path.join(
    root,
    'testing/reflective-questions/adaptive-openings-feasibility-2026-08-29.json'
  ),
  runner: path.join(
    root,
    'scripts/live/reflective-questions/run-adaptive-openings-shot3-vs-production-confirmation.ts'
  ),
  finalizer: path.join(
    root,
    'scripts/live/reflective-questions/finalize-adaptive-openings-shot3-vs-production-confirmation.ts'
  ),
};

const expectedHashes = {
  fixture: '6c6f9c59a294b5059b26c733f3a094e58e5273abdacfe86202207da0e002f953',
  rubric: '30990b2fc7b0bea309c27f12af7ab41efecbe31bcf5ecd6829b94ae5e3a1fee1',
  key: '92b60442ced1e8d502f42fbe78bc35667dc7e82fb20e6cefca494ae783a8b063',
  seal: '71bb70e32701a107091ccc40ee83c8a0c8f1435a61a5e416f27f9ddf5afee957',
  raw: 'acaf37a3453b6d77e4e727192ce6159f8c2628fada731660891ce1c278bf51f9',
  blindPacket: '530706ec4ae2802a5c5f4a55627fca41ff13a361dc09455d1645c264ac3e432e',
  verdicts: '8b575a7911d0641b67ce03e8c88d88e62e0c905eb58028a4223a9448a8e9c74b',
  reviewed: '0361b31912bfbc293c8456c4bf56f94ee20efb0543ce03ac4e4f762096245801',
  report: '363f2bb6f6cd987ed171339b31b1599d848b208971201bc8e710718db02a5163',
};

function sha(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

describe('Adaptive Shot 3 vs production blind confirmation', () => {
  it('pins the exact production and byte-frozen Shot 3 prompts', () => {
    expect(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID).toBe(
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId
    );
    expect(hashReflectiveQuestionPrompt(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE)).toBe(
      SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256
    );
    expect(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256).toBe(
      'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7'
    );
    expect(ADAPTIVE_OPENINGS_SHOT3_METHOD_ID).toBe(
      'oneiros-adaptive-reflective-openings-v0.3.0-final-candidate'
    );
    expect(hashReflectiveQuestionPrompt(ADAPTIVE_OPENINGS_SHOT3_BUNDLE)).toBe(
      ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256
    );
  });

  it('seals the unseen fixture, product rubric, and randomized key before calls', () => {
    expect(sha(paths.fixture)).toBe(expectedHashes.fixture);
    expect(sha(paths.rubric)).toBe(expectedHashes.rubric);
    expect(sha(paths.key)).toBe(expectedHashes.key);
    expect(sha(paths.seal)).toBe(expectedHashes.seal);
    const fixture = JSON.parse(readFileSync(paths.fixture, 'utf8')) as {
      scope: { paired_calls: number; retries: number; hard_cap_usd: number };
      review_contract: { pre_labelled_enacted_imaginal_targets_used: boolean };
      acceptance_gate: {
        adaptive_clear_ending_wins_min: number;
        production_clear_ending_wins_max: number;
      };
      cases: Array<{ id: string; dream: string; mode: string; language: string }>;
    };
    const prior = JSON.parse(readFileSync(paths.priorFixture, 'utf8')) as {
      cases: Array<{ id: string; dream: string }>;
    };
    expect(fixture.cases).toHaveLength(20);
    expect(fixture.cases.filter((item) => item.mode === 'standard')).toHaveLength(10);
    expect(fixture.cases.filter((item) => item.mode === 'advanced')).toHaveLength(10);
    expect(new Set(fixture.cases.map((item) => item.language)).size).toBe(12);
    expect(fixture.scope).toEqual({
      dreams: 20,
      paired_calls: 40,
      standard_dreams: 10,
      advanced_dreams: 10,
      quick_calls: 0,
      retries: 0,
      semantic_judges: 0,
      repairs: 0,
      reranking: 0,
      deployments: 0,
      hard_cap_usd: 1,
    });
    expect(fixture.review_contract.pre_labelled_enacted_imaginal_targets_used).toBe(false);
    expect(fixture.acceptance_gate).toMatchObject({
      adaptive_clear_ending_wins_min: 13,
      production_clear_ending_wins_max: 4,
    });
    const oldIds = new Set(prior.cases.map((item) => item.id));
    const oldDreams = new Set(prior.cases.map((item) => item.dream));
    expect(fixture.cases.every((item) => !oldIds.has(item.id))).toBe(true);
    expect(fixture.cases.every((item) => !oldDreams.has(item.dream))).toBe(true);
  });

  it('maps each pair to one production and one adaptive output without retries', () => {
    const key = JSON.parse(readFileSync(paths.key, 'utf8')) as {
      status: string;
      pairs: Array<{ case_id: string; A: string; B: string }>;
    };
    expect(key.status).toBe('sealed_before_model_calls');
    expect(key.pairs).toHaveLength(20);
    for (const pair of key.pairs) {
      expect(new Set([pair.A, pair.B])).toEqual(
        new Set(['production_v103', 'adaptive_shot3'])
      );
    }
    const runner = readFileSync(paths.runner, 'utf8');
    expect(runner).toContain("const COST_CAP_USD = 1;");
    expect(runner).toContain('const EXPECTED_CALLS = 40;');
    expect(runner).toContain('ONEIROS_ADAPTIVE_CONFIRMATION_COST_APPROVED');
    expect(runner).toContain('buildInitialReflectionRequest(dream, surface)');
    expect(runner).toContain('buildAdaptiveOpeningsShot3Request(dream, surface)');
    expect(runner).not.toContain('retryCompressedInitialInterpretation');
    expect(runner).not.toContain('semantic judge');
  });

  it('freezes the blind verdicts before reveal and records the failed product gate', () => {
    expect(sha(paths.raw)).toBe(expectedHashes.raw);
    expect(sha(paths.blindPacket)).toBe(expectedHashes.blindPacket);
    expect(sha(paths.verdicts)).toBe(expectedHashes.verdicts);
    expect(sha(paths.reviewed)).toBe(expectedHashes.reviewed);
    expect(sha(paths.report)).toBe(expectedHashes.report);

    const verdicts = JSON.parse(readFileSync(paths.verdicts, 'utf8')) as {
      reviewer_accessed_blind_key_before_freeze: boolean;
      pairs: unknown[];
    };
    expect(verdicts.reviewer_accessed_blind_key_before_freeze).toBe(false);
    expect(verdicts.pairs).toHaveLength(20);

    const reviewed = JSON.parse(readFileSync(paths.reviewed, 'utf8')) as {
      runtime: { calls: number; retries: number; exact_cost_usd: number; hard_cap_usd: number };
      human_summary: {
        ending_preferences: { adaptive_shot3: number; production_v103: number };
        variants: {
          adaptive_shot3: {
            would_ship: number;
            earned_cardinality_pass: number;
            serious_manufactured_answer_menu: number;
          };
          production_v103: { would_ship: number };
        };
        gate_passed: boolean;
        disposition: string;
      };
    };
    expect(reviewed.runtime).toEqual({
      calls: 40,
      retries: 0,
      exact_cost_usd: 0.60746,
      hard_cap_usd: 1,
    });
    expect(reviewed.human_summary.ending_preferences).toMatchObject({
      adaptive_shot3: 11,
      production_v103: 9,
    });
    expect(reviewed.human_summary.variants.adaptive_shot3).toMatchObject({
      would_ship: 16,
      earned_cardinality_pass: 20,
      serious_manufactured_answer_menu: 3,
    });
    expect(reviewed.human_summary.variants.production_v103.would_ship).toBe(18);
    expect(reviewed.human_summary.gate_passed).toBe(false);
    expect(reviewed.human_summary.disposition).toBe(
      'PARK_FOR_ONEIROS_V2_CONFIRMATION_GATE_FAILED'
    );

    const finalizer = readFileSync(paths.finalizer, 'utf8');
    expect(finalizer).toContain('reviewer_accessed_blind_key_before_freeze');
    expect(finalizer).toContain('PARK_FOR_ONEIROS_V2_CONFIRMATION_GATE_FAILED');
    expect(finalizer).not.toContain('buildInitialReflectionRequest');
    expect(finalizer).not.toContain('buildAdaptiveOpeningsShot3Request');
  });
});
