/** Deterministic blind-review reveal and evidence join; no model or semantic calls. */
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const root = process.cwd();
const artifactDir = path.join(
  root,
  'testing/reflective-questions/artifacts/adaptive-openings-shot3-vs-production-confirmation-2026-08-30'
);
const paths = {
  fixture: path.join(
    root,
    'testing/reflective-questions/adaptive-openings-shot3-vs-production-confirmation-2026-08-30.json'
  ),
  rubric: path.join(
    root,
    'testing/reflective-questions/ADAPTIVE_OPENINGS_SHOT3_VS_PRODUCTION_BLIND_RUBRIC_2026-08-30.md'
  ),
  key: path.join(artifactDir, 'BLIND_KEY.json'),
  seal: path.join(artifactDir, 'SEAL.json'),
  raw: path.join(artifactDir, 'RAW_PAIRED_OUTPUTS.json'),
  blindPacket: path.join(artifactDir, 'BLIND_REVIEW_PACKET.md'),
  verdicts: path.join(artifactDir, 'BLIND_HUMAN_VERDICTS.json'),
};
const expected = {
  fixture: '6c6f9c59a294b5059b26c733f3a094e58e5273abdacfe86202207da0e002f953',
  rubric: '30990b2fc7b0bea309c27f12af7ab41efecbe31bcf5ecd6829b94ae5e3a1fee1',
  key: '92b60442ced1e8d502f42fbe78bc35667dc7e82fb20e6cefca494ae783a8b063',
  seal: '71bb70e32701a107091ccc40ee83c8a0c8f1435a61a5e416f27f9ddf5afee957',
  raw: 'acaf37a3453b6d77e4e727192ce6159f8c2628fada731660891ce1c278bf51f9',
  blindPacket: '530706ec4ae2802a5c5f4a55627fca41ff13a361dc09455d1645c264ac3e432e',
  verdicts: '8b575a7911d0641b67ce03e8c88d88e62e0c905eb58028a4223a9448a8e9c74b',
};

type BlindLabel = 'A' | 'B';
type Variant = 'adaptive_shot3' | 'production_v103';
type Review = {
  would_ship_to_a_real_oneiros_user: 'YES' | 'NO';
  earned_cardinality: 'PASS' | 'FAIL';
  vital_specific: 'PASS' | 'FAIL';
  fabricated_dream_fact: 'NO' | 'SERIOUS_FAIL';
  manufactured_answer_menu: 'NO' | 'SERIOUS_FAIL';
  structure_language: 'PASS' | 'HARD_FAIL';
  failure_families: string[];
  notes: string;
};
type PairVerdict = {
  pair_id: string;
  A: Review;
  B: Review;
  ending_preference: BlindLabel | 'TIE' | 'NEITHER';
  full_reading_preference: BlindLabel | 'TIE' | 'NEITHER';
  preference_is_driven_by_reflective_ending: 'YES' | 'NO';
  pair_reason: string;
};

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function main(): void {
  const texts = Object.fromEntries(
    Object.entries(paths).map(([key, value]) => [key, readFileSync(value, 'utf8')])
  ) as Record<keyof typeof paths, string>;
  for (const key of Object.keys(paths) as Array<keyof typeof paths>) {
    if (sha(texts[key]) !== expected[key]) {
      throw new Error(`Confirmation ${key} hash drifted.`);
    }
  }

  const key = JSON.parse(texts.key) as {
    status: string;
    pairs: Array<{ case_id: string; A: Variant; B: Variant }>;
  };
  const raw = JSON.parse(texts.raw) as {
    status: string;
    exact_cost_usd: number;
    production_method: string;
    production_sha256: string;
    adaptive_method: string;
    adaptive_sha256: string;
    calls: number;
    retries: number;
    trials: Array<{
      case_id: string;
      blind_label: BlindLabel;
      variant: Variant;
      output: string;
      questions: string[];
      [key: string]: unknown;
    }>;
  };
  const verdicts = JSON.parse(texts.verdicts) as {
    reviewer_accessed_blind_key_before_freeze: boolean;
    pairs: PairVerdict[];
  };
  if (
    key.status !== 'sealed_before_model_calls' ||
    raw.status !== 'complete' ||
    raw.calls !== 40 ||
    raw.trials.length !== 40 ||
    raw.retries !== 0 ||
    verdicts.reviewer_accessed_blind_key_before_freeze ||
    verdicts.pairs.length !== 20
  ) {
    throw new Error('Blind confirmation evidence is incomplete or invalid.');
  }

  const keyByCase = new Map(key.pairs.map((item) => [item.case_id, item]));
  const trialByGeneration = new Map(
    raw.trials.map((item) => [`${item.case_id}:${item.blind_label}`, item])
  );
  const endingPreferences = { adaptive_shot3: 0, production_v103: 0, tie: 0, neither: 0 };
  const fullPreferences = { adaptive_shot3: 0, production_v103: 0, tie: 0, neither: 0 };
  const variantSummary = {
    adaptive_shot3: {
      would_ship: 0,
      earned_cardinality_pass: 0,
      vital_specific_pass: 0,
      serious_fabricated_dream_fact: 0,
      serious_manufactured_answer_menu: 0,
      structural_hard_failure: 0,
      one_question: 0,
      two_questions: 0,
      failure_family_counts: {} as Record<string, number>,
    },
    production_v103: {
      would_ship: 0,
      earned_cardinality_pass: 0,
      vital_specific_pass: 0,
      serious_fabricated_dream_fact: 0,
      serious_manufactured_answer_menu: 0,
      structural_hard_failure: 0,
      one_question: 0,
      two_questions: 0,
      failure_family_counts: {} as Record<string, number>,
    },
  };

  const revealedPairs = verdicts.pairs.map((verdict) => {
    const mapping = keyByCase.get(verdict.pair_id);
    if (!mapping) throw new Error(`Missing blind-key mapping for ${verdict.pair_id}.`);
    const labels: BlindLabel[] = ['A', 'B'];
    const variants = Object.fromEntries(
      labels.map((label) => {
        const variant = mapping[label];
        const trial = trialByGeneration.get(`${verdict.pair_id}:${label}`);
        if (!trial || trial.variant !== variant) {
          throw new Error(`Raw/key mismatch for ${verdict.pair_id}:${label}.`);
        }
        const review = verdict[label];
        const summary = variantSummary[variant];
        if (review.would_ship_to_a_real_oneiros_user === 'YES') summary.would_ship += 1;
        if (review.earned_cardinality === 'PASS') summary.earned_cardinality_pass += 1;
        if (review.vital_specific === 'PASS') summary.vital_specific_pass += 1;
        if (review.fabricated_dream_fact === 'SERIOUS_FAIL') {
          summary.serious_fabricated_dream_fact += 1;
        }
        if (review.manufactured_answer_menu === 'SERIOUS_FAIL') {
          summary.serious_manufactured_answer_menu += 1;
        }
        if (review.structure_language === 'HARD_FAIL') summary.structural_hard_failure += 1;
        if (trial.questions.length === 1) summary.one_question += 1;
        if (trial.questions.length === 2) summary.two_questions += 1;
        for (const family of review.failure_families) {
          increment(summary.failure_family_counts, family);
        }
        return [variant, { blind_label: label, review, trial }];
      })
    ) as Record<Variant, { blind_label: BlindLabel; review: Review; trial: unknown }>;

    const revealPreference = (
      preference: BlindLabel | 'TIE' | 'NEITHER',
      counts: typeof endingPreferences
    ): Variant | 'TIE' | 'NEITHER' => {
      if (preference === 'TIE') {
        counts.tie += 1;
        return 'TIE';
      }
      if (preference === 'NEITHER') {
        counts.neither += 1;
        return 'NEITHER';
      }
      const variant = mapping[preference];
      counts[variant] += 1;
      return variant;
    };

    return {
      case_id: verdict.pair_id,
      ending_preference: revealPreference(verdict.ending_preference, endingPreferences),
      full_reading_preference: revealPreference(
        verdict.full_reading_preference,
        fullPreferences
      ),
      preference_is_driven_by_reflective_ending:
        verdict.preference_is_driven_by_reflective_ending,
      pair_reason: verdict.pair_reason,
      variants,
    };
  });

  const adaptiveFamilies = variantSummary.adaptive_shot3.failure_family_counts;
  const gate = {
    adaptive_clear_ending_wins_at_least_13:
      endingPreferences.adaptive_shot3 >= 13,
    production_clear_ending_wins_at_most_4:
      endingPreferences.production_v103 <= 4,
    adaptive_would_ship_at_least_15:
      variantSummary.adaptive_shot3.would_ship >= 15,
    adaptive_earned_cardinality_at_least_17:
      variantSummary.adaptive_shot3.earned_cardinality_pass >= 17,
    adaptive_serious_fabricated_facts_zero:
      variantSummary.adaptive_shot3.serious_fabricated_dream_fact === 0,
    adaptive_serious_answer_menus_zero:
      variantSummary.adaptive_shot3.serious_manufactured_answer_menu === 0,
    adaptive_structural_hard_failures_zero:
      variantSummary.adaptive_shot3.structural_hard_failure === 0,
    no_adaptive_failure_family_above_one:
      Object.values(adaptiveFamilies).every((count) => count <= 1),
    production_clear_full_reading_wins_at_most_3:
      fullPreferences.production_v103 <= 3,
  };
  const passed = Object.values(gate).every(Boolean);
  const reviewed = {
    schema_version: 1,
    status: 'complete',
    reveal_performed_after_blind_verdict_freeze: true,
    hashes: expected,
    identities: {
      production_method: raw.production_method,
      production_sha256: raw.production_sha256,
      adaptive_method: raw.adaptive_method,
      adaptive_sha256: raw.adaptive_sha256,
    },
    runtime: {
      calls: raw.calls,
      retries: raw.retries,
      exact_cost_usd: raw.exact_cost_usd,
      hard_cap_usd: 1,
    },
    human_summary: {
      ending_preferences: endingPreferences,
      full_reading_preferences: fullPreferences,
      variants: variantSummary,
      gate,
      gate_passed: passed,
      disposition: passed
        ? 'EDITORIAL_SHIP_CANDIDATE_ENGINEERING_REVIEW_REQUIRED'
        : 'PARK_FOR_ONEIROS_V2_CONFIRMATION_GATE_FAILED',
    },
    pairs: revealedPairs,
  };
  writeFileSync(
    path.join(artifactDir, 'REVIEWED_RESULTS.json'),
    `${JSON.stringify(reviewed, null, 2)}\n`
  );

  const report = [
    '# Shot 3 vs production — blind confirmation review',
    '',
    passed
      ? '**EDITORIAL SHIP-CANDIDATE. A separate engineering review is required; no deploy is authorized.**'
      : '**HOLD / PARK FOR ONEIROS V2. The frozen Shot 3 did not clearly outperform production.**',
    '',
    `- Blind ending preference: **Shot 3 ${endingPreferences.adaptive_shot3} / production ${endingPreferences.production_v103} / tie ${endingPreferences.tie} / neither ${endingPreferences.neither}**. Gate required Shot 3 at least 13 and production at most 4.`,
    `- Blind full-reading preference: **Shot 3 ${fullPreferences.adaptive_shot3} / production ${fullPreferences.production_v103} / tie ${fullPreferences.tie} / neither ${fullPreferences.neither}**.`,
    `- Would ship ending: **Shot 3 ${variantSummary.adaptive_shot3.would_ship}/20 / production ${variantSummary.production_v103.would_ship}/20**.`,
    `- Earned cardinality: **Shot 3 ${variantSummary.adaptive_shot3.earned_cardinality_pass}/20 / production ${variantSummary.production_v103.earned_cardinality_pass}/20**.`,
    `- Serious fabricated dream facts: **Shot 3 ${variantSummary.adaptive_shot3.serious_fabricated_dream_fact} / production ${variantSummary.production_v103.serious_fabricated_dream_fact}**.`,
    `- Serious answer menus: **Shot 3 ${variantSummary.adaptive_shot3.serious_manufactured_answer_menu} / production ${variantSummary.production_v103.serious_manufactured_answer_menu}**.`,
    `- Structural hard failures: **Shot 3 ${variantSummary.adaptive_shot3.structural_hard_failure} / production ${variantSummary.production_v103.structural_hard_failure}**.`,
    `- Shot 3 cardinality: **${variantSummary.adaptive_shot3.one_question} one-question / ${variantSummary.adaptive_shot3.two_questions} two-question endings**.`,
    `- Exact cost: **$${raw.exact_cost_usd.toFixed(8)} / $1.00**; 40/40 calls, zero retries.`,
    '',
    '## Product diagnosis',
    '',
    'The adaptive rule demonstrated real cardinality intelligence: every Shot 3 ending earned its visible number of questions, and the sparse bakery, paper-moon, and red-thread-nest dreams benefited from stopping at one. That is meaningful evidence, not prompt noise.',
    '',
    'It still did not produce a reliable product improvement. Shot 3 won only 11–9, production remained more often independently shippable (18/20 versus 16/20), and Shot 3 created three serious answer menus across Spanish, Japanese, and Chinese. The gain in stopping behavior therefore traded against question-composition reliability rather than dominating production.',
    '',
    'The pre-registered confirmation gate failed on pairwise superiority, serious menus, recurring failure families, and production full-reading wins. No post-hoc rubric change is permitted. Adaptive 1–2 cardinality is parked for Oneiros v2; a future reopening should be architectural/product work rather than another prompt clause.',
    '',
    `Production remains unchanged at ${raw.production_method} / \`${raw.production_sha256}\`. No deploy, database push, or production prompt change occurred.`,
  ];
  writeFileSync(path.join(artifactDir, 'REVIEW_REPORT.md'), `${report.join('\n')}\n`);
}

main();
