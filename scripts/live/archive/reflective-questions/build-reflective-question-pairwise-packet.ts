import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  PAIRWISE_PREFERENCE_ANSWERS,
  WITNESSED_OPENING_BASELINE_ID,
  WITNESSED_OPENING_UX_SCORES,
} from '../../../../src/ai/rd/reflective-questions/archive/reflectiveQuestionWitnessedOpeningExperiment';
import { REFLECTIVE_QUESTION_SURGICAL_ATTENTION_ID } from '../../../../src/ai/rd/reflective-questions/archive/reflectiveQuestionSurgicalAttentionExperiment';
import { REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_ID } from '../../../../src/ai/rd/reflective-questions/archive/reflectiveQuestionRelationEligibilityAblationExperiment';
import { REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_ID } from '../../../../src/ai/rd/reflective-questions/lineage/reflectiveQuestionSelectionLanguageDecouplingExperiment';
import {
  LANGUAGE_OPERATOR_OPENING_PRESERVATION,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_ID,
} from '../../../../src/ai/rd/reflective-questions/lineage/reflectiveQuestionLanguageOperatorExperiment';

const FROZEN_V13_SENTINEL_DIR =
  'tmp/reflective-question-oneiros-reader-2026-08-26T15-50-32-110Z';
const FROZEN_V13_LIVE_DIR =
  'tmp/reflective-question-v1-3-live-benchmark-2026-08-26T16-24-43-552Z';

type Trial = {
  case_id: string;
  repeat: number;
  title: string;
  dream: string;
  question: string | null;
  raw_question: string;
  parse_error: string | null;
  technical_error: string | null;
};

type Results = {
  generated_at?: string;
  active_method_id: string;
  trials: Trial[];
};

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function trialKey(trial: Pick<Trial, 'case_id' | 'repeat'>): string {
  return `${trial.case_id}:${trial.repeat}`;
}

function displayedQuestion(trial: Trial): string {
  return (
    trial.question ??
    `(invalid output: ${trial.technical_error ?? trial.parse_error ?? trial.raw_question ?? 'unknown'})`
  );
}

function stableOrder(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function leftGoesToCandidate(seed: string, key: string): boolean {
  return stableOrder(`${seed}:${key}:side`) % 2 === 0;
}

function resolveBaselineDir(candidateDir: string, explicit?: string): string {
  if (explicit) return path.resolve(process.cwd(), explicit);
  const isLive = path.basename(candidateDir).includes('live-benchmark');
  return path.resolve(
    process.cwd(),
    isLive ? FROZEN_V13_LIVE_DIR : FROZEN_V13_SENTINEL_DIR
  );
}

function resolvePacketKind(
  raw: string | undefined
): 'default' | 'vs-ablation' | 'vs-v13' | 'vs-decoupling' {
  if (!raw) return 'default';
  if (raw === 'vs-ablation' || raw === 'vs-v13' || raw === 'vs-decoupling') {
    return raw;
  }
  throw new Error(
    'Packet kind must be omitted, vs-ablation, vs-v13, or vs-decoupling so dual packets do not overwrite each other.'
  );
}

function pairwiseFilenames(
  kind: 'default' | 'vs-ablation' | 'vs-v13' | 'vs-decoupling'
) {
  const prefix =
    kind === 'vs-ablation'
      ? 'PAIRWISE_VS_ABLATION'
      : kind === 'vs-v13'
        ? 'PAIRWISE_VS_V13'
        : kind === 'vs-decoupling'
          ? 'PAIRWISE_VS_DECOUPLING'
          : 'PAIRWISE';
  return {
    packet: `${prefix}_REVIEW_PACKET.md`,
    sheet: `${prefix}_REVIEW_SHEET.json`,
    manifest: `${prefix}_MANIFEST.json`,
  };
}

function main() {
  const rawCandidate = process.argv[2];
  if (!rawCandidate) {
    throw new Error(
      'Usage: npm run pairwise:reflective-questions-isolated-candidate -- <candidate-output-dir> [baseline-dir] [vs-ablation|vs-v13|vs-decoupling]'
    );
  }
  const candidateDir = path.resolve(process.cwd(), rawCandidate);
  const packetKind = resolvePacketKind(process.argv[4]);
  const files = pairwiseFilenames(packetKind);
  const baselineDir = resolveBaselineDir(candidateDir, process.argv[3]);
  const candidateResultsPath = path.join(candidateDir, 'results.json');
  const baselineResultsPath = path.join(baselineDir, 'results.json');
  for (const filePath of [candidateResultsPath, baselineResultsPath]) {
    if (!existsSync(filePath)) {
      throw new Error(`Missing ${filePath}.`);
    }
  }

  const candidate = readJson<Results>(candidateResultsPath);
  const baseline = readJson<Results>(baselineResultsPath);
  if (candidate.active_method_id === WITNESSED_OPENING_BASELINE_ID) {
    throw new Error(
      `Candidate results must be an isolated experiment, not frozen ${WITNESSED_OPENING_BASELINE_ID}.`
    );
  }
  if (candidate.active_method_id === baseline.active_method_id) {
    throw new Error(
      'Candidate and baseline results must come from different frozen methods.'
    );
  }
  if (packetKind === 'default') {
    if (baseline.active_method_id !== WITNESSED_OPENING_BASELINE_ID) {
      throw new Error(
        `Default pairwise packets still require frozen ${WITNESSED_OPENING_BASELINE_ID}. Use vs-ablation or vs-v13 for other matched baselines.`
      );
    }
  } else if (!process.argv[3]) {
    throw new Error(
      `${packetKind} pairwise packets require an explicit frozen matched baseline directory.`
    );
  }

  const includeHoldsTheCharge =
    candidate.active_method_id === REFLECTIVE_QUESTION_SURGICAL_ATTENTION_ID ||
    candidate.active_method_id ===
      REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_ID ||
    candidate.active_method_id ===
      REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_ID ||
    candidate.active_method_id === REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_ID;
  const includeLanguageOperatorUx =
    candidate.active_method_id === REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_ID;
  const baselineByKey = new Map(
    baseline.trials.map((trial) => [trialKey(trial), trial])
  );
  const seed = candidate.generated_at ?? path.basename(candidateDir);
  const pairs = candidate.trials.map((candidateTrial) => {
    const key = trialKey(candidateTrial);
    const baselineTrial = baselineByKey.get(key);
    if (!baselineTrial) {
      throw new Error(`Matched baseline is missing trial ${key}.`);
    }
    const candidateOnLeft = leftGoesToCandidate(seed, key);
    const leftTrial = candidateOnLeft ? candidateTrial : baselineTrial;
    const rightTrial = candidateOnLeft ? baselineTrial : candidateTrial;
    return {
      key,
      candidateOnLeft,
      candidateTrial,
      baselineTrial,
      leftTrial,
      rightTrial,
    };
  });

  const shuffled = [...pairs].sort(
    (left, right) =>
      stableOrder(`${seed}:${left.key}:order`) -
      stableOrder(`${seed}:${right.key}:order`)
  );

  const items = shuffled.map((pair, index) => {
    const pair_id = `P${String(index + 1).padStart(3, '0')}`;
    const sideScores = {
      pull_to_answer: null as (typeof WITNESSED_OPENING_UX_SCORES)[number] | null,
      felt_read: null as (typeof WITNESSED_OPENING_UX_SCORES)[number] | null,
      ...(includeHoldsTheCharge
        ? {
            holds_the_charge: null as
              | (typeof WITNESSED_OPENING_UX_SCORES)[number]
              | null,
          }
        : {}),
      ...(includeLanguageOperatorUx
        ? {
            first_read_clarity: null as
              | (typeof WITNESSED_OPENING_UX_SCORES)[number]
              | null,
            dream_native_language: null as
              | (typeof WITNESSED_OPENING_UX_SCORES)[number]
              | null,
          }
        : {}),
    };
    return {
      pair_id,
      title: pair.candidateTrial.title,
      dream: pair.candidateTrial.dream,
      left_question: displayedQuestion(pair.leftTrial),
      right_question: displayedQuestion(pair.rightTrial),
      preference: null as (typeof PAIRWISE_PREFERENCE_ANSWERS)[number] | null,
      reason: '',
      left: { ...sideScores },
      right: { ...sideScores },
      _match: {
        case_id: pair.candidateTrial.case_id,
        repeat: pair.candidateTrial.repeat,
        left_method_id: pair.candidateOnLeft
          ? candidate.active_method_id
          : baseline.active_method_id,
        right_method_id: pair.candidateOnLeft
          ? baseline.active_method_id
          : candidate.active_method_id,
      },
    };
  });

  const packet = [
    '# Oneiros Reflective Questions — Pairwise Product Preference',
    '',
    `- Generated from: ${path.relative(process.cwd(), candidateDir)}`,
    `- Matched baseline: ${path.relative(process.cwd(), baselineDir)}`,
    `- Pairs: ${items.length}`,
    '- Method identity is withheld. Do not open `' +
      files.manifest +
      '` until this packet is fully scored.',
    '- Score this packet before the candidate quality sheet.',
    '',
    'If Oneiros could show you only one of these questions after recording this dream, which would you choose?',
    '',
    '- Preference: `left` / `right` / `tie` / `neither` (do not use A/B)',
    '- Short reason',
    '- Pull to Answer on each side: 0 none / 1 mild / 2 genuine pull',
    '- Felt Read on each side: 0 generic / 1 grounded / 2 precisely attended',
    ...(includeHoldsTheCharge
      ? [
          '- Holds the Charge on each side: 0 flattened / 1 partial / 2 stays with the charged configuration',
        ]
      : []),
    ...(includeLanguageOperatorUx
      ? [
          '- First-read clarity on each side: 0 reread / 1 effortful / 2 immediate',
          '- Dream-native language on each side: 0 framework / 1 mixed / 2 dream-native',
        ]
      : []),
    '',
    ...items.flatMap((item) => [
      `## ${item.pair_id}`,
      '',
      `### ${item.title}`,
      '',
      item.dream,
      '',
      '**Left**',
      '',
      item.left_question,
      '',
      '**Right**',
      '',
      item.right_question,
      '',
      '- Preference: left / right / tie / neither',
      '- Reason: ',
      '- Left Pull to Answer (0/1/2): ',
      '- Left Felt Read (0/1/2): ',
      '- Right Pull to Answer (0/1/2): ',
      '- Right Felt Read (0/1/2): ',
      ...(includeHoldsTheCharge
        ? [
            '- Left Holds the Charge (0/1/2): ',
            '- Right Holds the Charge (0/1/2): ',
          ]
        : []),
      ...(includeLanguageOperatorUx
        ? [
            '- Left First-read clarity (0/1/2): ',
            '- Right First-read clarity (0/1/2): ',
            '- Left Dream-native language (0/1/2): ',
            '- Right Dream-native language (0/1/2): ',
          ]
        : []),
      '',
    ]),
  ].join('\n');

  mkdirSync(candidateDir, { recursive: true });
  writeFileSync(path.join(candidateDir, files.packet), packet);
  writeFileSync(
    path.join(candidateDir, files.sheet),
    `${JSON.stringify(
      {
        instructions: {
          preference: [...PAIRWISE_PREFERENCE_ANSWERS],
          pull_to_answer: [...WITNESSED_OPENING_UX_SCORES],
          felt_read: [...WITNESSED_OPENING_UX_SCORES],
          ...(includeHoldsTheCharge
            ? { holds_the_charge: [...WITNESSED_OPENING_UX_SCORES] }
            : {}),
          ...(includeLanguageOperatorUx
            ? {
                first_read_clarity: [...WITNESSED_OPENING_UX_SCORES],
                dream_native_language: [...WITNESSED_OPENING_UX_SCORES],
              }
            : {}),
          score_before_quality_sheet: true,
        },
        reviews: items.map(
          ({ _match: _withheld, ...review }) => review
        ),
      },
      null,
      2
    )}\n`
  );
  if (packetKind === 'vs-decoupling') {
    const preservationItems = candidate.trials.map((candidateTrial) => {
      const key = trialKey(candidateTrial);
      const baselineTrial = baselineByKey.get(key);
      if (!baselineTrial) {
        throw new Error(`Matched baseline is missing trial ${key}.`);
      }
      return {
        case_id: candidateTrial.case_id,
        repeat: candidateTrial.repeat,
        title: candidateTrial.title,
        dream: candidateTrial.dream,
        frozen_decoupling_question: displayedQuestion(baselineTrial),
        candidate_question: displayedQuestion(candidateTrial),
        opening_preservation: null as
          | (typeof LANGUAGE_OPERATOR_OPENING_PRESERVATION)[number]
          | null,
        notes: '',
      };
    });
    writeFileSync(
      path.join(candidateDir, 'OPENING_PRESERVATION_PACKET.md'),
      [
        '# Oneiros Reflective Questions — Opening Preservation',
        '',
        '- Score PAIRWISE_VS_DECOUPLING first. Do not open this packet until pairwise is complete.',
        '- This packet is diagnostic, not blind product preference.',
        '- SAME: same central dream moment / phenomenon / unresolved opening.',
        '- NEAR: same scene and psychological configuration, but slightly different concrete anchor.',
        '- DIFFERENT: the candidate moved to another opening.',
        '- Desired: SAME + NEAR ≥ 90%; ideally SAME ≥ 75%.',
        '- A language experiment that wins by choosing completely different dream material has failed causal isolation.',
        '',
        ...preservationItems.flatMap((item) => [
          `## ${item.case_id} — repeat ${item.repeat}`,
          '',
          `### ${item.title}`,
          '',
          item.dream,
          '',
          '**Frozen decoupling**',
          '',
          item.frozen_decoupling_question,
          '',
          '**Candidate**',
          '',
          item.candidate_question,
          '',
          '- Opening preservation: SAME / NEAR / DIFFERENT',
          '- Notes: ',
          '',
        ]),
      ].join('\n')
    );
    writeFileSync(
      path.join(candidateDir, 'OPENING_PRESERVATION_SHEET.json'),
      `${JSON.stringify(
        {
          instructions: {
            opening_preservation: [...LANGUAGE_OPERATOR_OPENING_PRESERVATION],
            score_after_pairwise: true,
            desired_same_plus_near: 0.9,
            desired_same: 0.75,
          },
          reviews: preservationItems,
        },
        null,
        2
      )}\n`
    );
  }
  writeFileSync(
    path.join(candidateDir, files.manifest),
    `${JSON.stringify(
      items.map((item) => ({
        pair_id: item.pair_id,
        case_id: item._match.case_id,
        repeat: item._match.repeat,
        left_method_id: item._match.left_method_id,
        right_method_id: item._match.right_method_id,
      })),
      null,
      2
    )}\n`
  );
  process.stdout.write(`${path.join(candidateDir, files.packet)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
}
