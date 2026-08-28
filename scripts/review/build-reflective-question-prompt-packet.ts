/**
 * Reproducible reviewer export for the synthetic combined editorial-arc Gate 1.
 * It writes exact runtime messages only; it performs no network or AI calls.
 */
import { createHash } from 'crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  buildInitialReflectionRequest,
  DREAM_REFLECTION_EDITORIAL_ARC_BUNDLE,
  DREAM_REFLECTION_PROMPT_ID,
  DREAM_REFLECTION_PROMPT_VERSION,
} from '../../src/ai/dreamReflectionPrompt';
import {
  REFLECTION_EDITORIAL_ARC_METHOD_ID,
  REFLECTION_EDITORIAL_ARC_METHOD_VERSION,
  REFLECTION_EDITORIAL_ARC_PROTOCOL_VERSION,
} from '../../src/ai/reflectionEditorialArc';
import {
  REFLECTIVE_QUESTION_METHOD_ID,
  REFLECTIVE_QUESTION_METHOD_VERSION,
  REFLECTIVE_QUESTION_PROMPT,
  REFLECTIVE_QUESTION_PROMPT_ID,
  REFLECTIVE_QUESTION_PROMPT_VERSION,
} from '../../src/ai/reflectiveQuestionPrompt';
import { buildReflectiveQuestionResponseFormat } from '../../src/ai/reflectiveQuestionResponseFormat';
import {
  REFLECTIVE_QUESTION_V2_MULTILINGUAL_FIXTURE,
  REFLECTIVE_QUESTION_V2_SOURCE_FIXTURE,
  REFLECTIVE_QUESTION_V5_GATE_1_CASE_IDS,
  type ReflectiveQuestionV2Fixture,
  type ReflectiveQuestionV2FixtureCase,
} from '../lib/reflectiveQuestionV2Benchmark';

const DEFAULT_OUTPUT_DIR =
  'tmp/reflection-editorial-arc-v2-candidate-review';

function fixture(relativePath: string): ReflectiveQuestionV2Fixture {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), relativePath), 'utf8')
  ) as ReflectiveQuestionV2Fixture;
}

function gateCases(): ReflectiveQuestionV2FixtureCase[] {
  const all = [
    ...fixture(REFLECTIVE_QUESTION_V2_SOURCE_FIXTURE).cases,
    ...fixture(REFLECTIVE_QUESTION_V2_MULTILINGUAL_FIXTURE).cases,
  ];
  return REFLECTIVE_QUESTION_V5_GATE_1_CASE_IDS.map((id) => {
    const found = all.find((candidate) => candidate.id === id);
    if (!found) throw new Error(`Missing frozen Gate 1 case: ${id}`);
    return found;
  });
}

function sha256(value: string): string {
  return createHash('sha256').update(value.trim()).digest('hex');
}

function fence(value: string, language = 'text'): string {
  return `~~~~${language}\n${value}\n~~~~`;
}

function main(): void {
  const outputArg = process.argv.find((arg) => arg.startsWith('--output-dir='));
  const outputDir = path.resolve(
    process.cwd(),
    outputArg?.slice('--output-dir='.length) || DEFAULT_OUTPUT_DIR
  );
  mkdirSync(outputDir, { recursive: true });

  const requests = gateCases().map((testCase) => ({
    case_id: testCase.id,
    title: testCase.title,
    language: testCase.language,
    request: buildInitialReflectionRequest(
      {
        title: testCase.title,
        date: '2026-08-28',
        content: testCase.content,
      },
      'standard'
    ),
  }));
  const first = requests[0].request;
  const referenceCase = gateCases()[0];
  const initialModeReferenceRequests = (['quick', 'standard', 'advanced'] as const).map(
    (depth) => ({
      depth,
      request: buildInitialReflectionRequest(
        {
          title: referenceCase.title,
          date: '2026-08-28',
          content: referenceCase.content,
        },
        depth
      ),
    })
  );
  const commonSystemMessages = first.messages.filter((message) => message.role === 'system');
  const systemChars = commonSystemMessages.reduce(
    (total, message) => total + message.content.length,
    0
  );
  const promptSha = sha256(DREAM_REFLECTION_EDITORIAL_ARC_BUNDLE);

  const exactJson = {
    generated_at: new Date().toISOString(),
    source: 'synthetic_gate_fixture',
    performs_ai_calls: false,
    gate_run: null,
    model: 'gpt-5.4',
    disable_anthropic_fallback: true,
    method_id: REFLECTION_EDITORIAL_ARC_METHOD_ID,
    method_version: REFLECTION_EDITORIAL_ARC_METHOD_VERSION,
    reading_prompt_id: DREAM_REFLECTION_PROMPT_ID,
    reading_prompt_version: DREAM_REFLECTION_PROMPT_VERSION,
    protocol_version: REFLECTION_EDITORIAL_ARC_PROTOCOL_VERSION,
    prompt_sha256: promptSha,
    shared_request_parameters: {
      task: 'interpretation_standard',
      temperature: first.temperature,
      max_completion_tokens: first.tokenLimit,
      max_tokens: first.tokenLimit,
    },
    gate1_requests: requests,
    initial_mode_reference_requests_not_all_used_in_gate1: initialModeReferenceRequests,
    chat_followup_question_engine_not_used_in_gate1: {
      method_id: REFLECTIVE_QUESTION_METHOD_ID,
      method_version: REFLECTIVE_QUESTION_METHOD_VERSION,
      prompt_id: REFLECTIVE_QUESTION_PROMPT_ID,
      prompt_version: REFLECTIVE_QUESTION_PROMPT_VERSION,
      system_prompt: REFLECTIVE_QUESTION_PROMPT,
      response_format: buildReflectiveQuestionResponseFormat(),
    },
  };

  const markdown = [
    '# Oneiros Editorial Arc v2 — exact candidate prompt packet',
    '',
    `Generated from runtime source: ${exactJson.generated_at}`,
    '',
    '## Scope and provenance',
    '',
    'This packet contains the exact local-only v2 candidate requests prepared for the next Gate 1. The eight dreams are synthetic frozen fixtures; there is no user or production data. This export performs no AI call, and the candidate remains on production hold.',
    '',
    '- Gate run: not yet executed',
    `- Model: \`${exactJson.model}\``,
    `- Method: \`${REFLECTION_EDITORIAL_ARC_METHOD_ID}\` / \`${REFLECTION_EDITORIAL_ARC_METHOD_VERSION}\``,
    `- Reading prompt: \`${DREAM_REFLECTION_PROMPT_ID}\` / \`${DREAM_REFLECTION_PROMPT_VERSION}\``,
    `- Protocol: \`v${REFLECTION_EDITORIAL_ARC_PROTOCOL_VERSION}\``,
    `- Bundle SHA-256: \`${promptSha}\``,
    `- Task: \`${first.task}\``,
    `- Temperature: \`${first.temperature}\``,
    `- Output ceiling: \`${first.tokenLimit}\` tokens`,
    '- Anthropic fallback: disabled for this gate',
    '- Retries, question call, repair, validator, and judge: none',
    '',
    '## Engineering and psychological hypothesis',
    '',
    'The failed v1 evidence did not show an inability to read dreams. It showed that reading-first generation, mandatory questioning, length pressure, and a reaction-shell attractor distorted the final invitation. This candidate changes that editorial contract rather than adding another judge or repair layer.',
    '',
    'My leading hypotheses are:',
    '',
    '1. **Question/no-question is decided before prose.** The model commits the private aperture first, while the person still experiences reading followed by an optional question.',
    '2. **Prompt competition is materially reduced.** The three system messages total ' +
      `\`${systemChars}\` characters (roughly \`${Math.ceil(systemChars / 4)}\` tokens by a crude character estimate). ` +
      'The constitution and mode contracts now keep only distinct obligations; the four learned epistemic boundaries remain explicit.',
    '3. **Silence is legitimate.** A complete or peaceful dream may emit `question:null`; the reading remains complete and a neutral localized continuation affordance preserves access to conversation.',
    '4. **Positive craft identity is relational.** The question should be carried by the dream’s relation, paradox, verb, gesture, threshold, or image-logic. Felt response remains available when genuinely central but is no longer the default shell.',
    '5. **Depth is resolution, not volume.** Standard stops when the central movement is illuminated; Advanced lingers only when transformations and contradictions earn the space.',
    '6. **Failure isolation is strict.** Malformed opening JSON is never repaired or guessed. A valid `BEGIN_DREAM_READING` boundary still salvages the complete reading as `rejected`.',
    '',
    'I do **not** recommend adding self-check fields, a judge, a Director/Composer split, or a repair loop before this hypothesis is tested. Human review remains the semantic authority.',
    '',
    '## Questions for the professional reviewer',
    '',
    '- Does the private-first decision produce a complete reading without conspicuous withholding?',
    '- Does `0–1` remove fake unfinished business while preserving genuine human pull?',
    '- Has relation/image-logic replaced the reusable felt-reaction shell in practice?',
    '- Does adaptive density reduce symbolic over-coverage in Standard and small Advanced dreams?',
    '- Do the four explicit epistemic boundaries remain strong after pruning?',
    '',
    '## Exact common system messages used by all eight Gate 1 calls',
    '',
    ...commonSystemMessages.flatMap((message, index) => [
      `### System message ${index + 1}`,
      '',
      fence(message.content),
      '',
    ]),
    '## Exact user message for each Gate 1 call',
    '',
    ...requests.flatMap((item, index) => {
      const user = item.request.messages.find((message) => message.role === 'user');
      return [
        `### ${index + 1}. \`${item.case_id}\` — ${item.title}`,
        '',
        `Language fixture: \`${item.language}\``,
        '',
        fence(user?.content ?? ''),
        '',
      ];
    }),
    '## Appendix: Quick and Advanced initial prompts — not used in Gate 1',
    '',
    'Gate 1 used Standard mode only. For completeness, the following are the exact mode-specific system-message-3 and user-message variants generated from the first frozen fixture. System messages 1 and 2 are identical to those already printed above.',
    '',
    ...initialModeReferenceRequests
      .filter((item) => item.depth !== 'standard')
      .flatMap((item) => {
        const modeSystem = item.request.messages.filter((message) => message.role === 'system')[2];
        const user = item.request.messages.find((message) => message.role === 'user');
        return [
          `### ${item.depth.toUpperCase()} mode`,
          '',
          `Task: \`${item.request.task}\` · temperature: \`${item.request.temperature}\` · output ceiling: \`${item.request.tokenLimit}\``,
          '',
          '#### Exact mode-specific system message 3',
          '',
          fence(modeSystem?.content ?? ''),
          '',
          '#### Exact representative user message',
          '',
          fence(user?.content ?? ''),
          '',
        ];
      }),
    '## Appendix: current chat follow-up question engine — not used in Gate 1',
    '',
    'The initial Gate 1 questions above were created inside the combined reading call. The following v5 system prompt is included because it remains the local architecture for optional chat follow-up questions. It must not be used to explain the Gate 1 outputs.',
    '',
    `- Method: \`${REFLECTIVE_QUESTION_METHOD_ID}\` / \`${REFLECTIVE_QUESTION_METHOD_VERSION}\``,
    `- Prompt: \`${REFLECTIVE_QUESTION_PROMPT_ID}\` / \`${REFLECTIVE_QUESTION_PROMPT_VERSION}\``,
    '',
    '### Exact chat question system prompt',
    '',
    fence(REFLECTIVE_QUESTION_PROMPT),
    '',
    '### Exact chat question Structured Outputs schema',
    '',
    fence(JSON.stringify(buildReflectiveQuestionResponseFormat(), null, 2), 'json'),
    '',
    'The complete machine-readable Gate 1 requests are supplied alongside this Markdown file as `EXACT_GATE1_REQUESTS.json`.',
    '',
  ].join('\n');

  writeFileSync(
    path.join(outputDir, 'EXACT_GATE1_REQUESTS.json'),
    `${JSON.stringify(exactJson, null, 2)}\n`,
    'utf8'
  );
  writeFileSync(
    path.join(outputDir, 'PROMPTS_AND_DIAGNOSIS_FOR_REVIEW.md'),
    markdown,
    'utf8'
  );
  writeFileSync(
    path.join(outputDir, 'REVIEW_ORDER.md'),
    [
      '# Oneiros Gate 1 — recommended review order',
      '',
      'To preserve an independent judgment, review the files in this order:',
      '',
      '1. After a live Gate exists: `BLIND_REVIEW.md` — score every whole journey and write an independent rationale.',
      '2. Only after all scores are locked: `GOLD_CHECKPOINTS_AFTER_SCORING.md` — reveal diagnostic expectations.',
      '3. `PROMPTS_AND_DIAGNOSIS_FOR_REVIEW.md` — inspect exact shared prompts, user messages, and hypothesis.',
      '4. `EXACT_GATE1_REQUESTS.json` — machine-readable request verification.',
      '5. `DIAGNOSTICS.json` and `SUMMARY.json` — inspect mechanics, evidence, model, latency, and cost last.',
      '',
      'If the reviewer has already seen the outputs or prior scorecard, the review is no longer fully blind; record that explicitly rather than restarting the fiction of blindness.',
      '',
    ].join('\n'),
    'utf8'
  );
  console.log(JSON.stringify({
    outputDir,
    markdown: path.join(outputDir, 'PROMPTS_AND_DIAGNOSIS_FOR_REVIEW.md'),
    json: path.join(outputDir, 'EXACT_GATE1_REQUESTS.json'),
    reviewOrder: path.join(outputDir, 'REVIEW_ORDER.md'),
    promptSha256: promptSha,
    systemChars,
    cases: requests.length,
  }, null, 2));
}

main();
