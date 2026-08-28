import { readFileSync } from 'fs';
import path from 'path';
import {
  buildInitialReflectionRequest,
  DREAM_CONSTITUTION_PROMPT,
  DREAM_REFLECTION_PROMPT_ID,
} from '../src/ai/dreamReflectionPrompt';
import {
  buildSameCallMinimalRequest,
  extractTerminalInterrogative,
  hashSameCallMinimalBundle,
  hashSameCallMinimalV11Bundle,
  mapReadingDepthToQuestionMode,
  SAME_CALL_MINIMAL_METHOD_ID,
  SAME_CALL_MINIMAL_MODEL,
  SAME_CALL_MINIMAL_PROMPT_ID,
  SAME_CALL_MINIMAL_QUESTION_PROMPT,
  SAME_CALL_MINIMAL_QUESTION_TOKEN_BUFFER,
  SAME_CALL_MINIMAL_BUNDLE_SHA256,
  SAME_CALL_MINIMAL_V11_BUNDLE_SHA256,
  SAME_CALL_MINIMAL_V11_METHOD_ID,
  SAME_CALL_MINIMAL_V11_QUESTION_PROMPT,
  looksLikeReflectiveQuestion,
  splitSameCallReadingAndQuestion,
} from '../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate';
import {
  assertDisjunctionDictionaryCoversRegistry,
  lintSameCallDisjunction,
  questionOpenerFamily,
} from '../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalDiagnostics';

const dream = {
  title: 'The open gate',
  date: '2026-08-28',
  content: 'I stand beside an open gate. A fox crosses, and I remain at the threshold.',
};

describe('same-call minimal Reader+question R&D', () => {
  it('wraps the frozen production Reader without changing its constitution', () => {
    const production = buildInitialReflectionRequest(dream, 'standard');
    const experiment = buildSameCallMinimalRequest({
      dream,
      depth: 'standard',
      outputLanguage: 'el',
    });
    expect(DREAM_REFLECTION_PROMPT_ID).toBe('oneiros-dream-reflection-v3.1.0-candidate');
    expect(SAME_CALL_MINIMAL_METHOD_ID).toBe('oneiros-same-call-minimal-v1.2.0-candidate');
    expect(SAME_CALL_MINIMAL_PROMPT_ID).toBe('oneiros-same-call-minimal-prompt-v1.2.0-candidate');
    expect(SAME_CALL_MINIMAL_V11_METHOD_ID).toBe('oneiros-same-call-minimal-v1.1.0-candidate');
    expect(SAME_CALL_MINIMAL_MODEL).toBe('gpt-5.4');
    expect(experiment.task).toBe(production.task);
    expect(experiment.temperature).toBe(production.temperature);
    expect(experiment.tokenLimit).toBe(production.tokenLimit + SAME_CALL_MINIMAL_QUESTION_TOKEN_BUFFER);
    expect(experiment.messages[0].content).toBe(DREAM_CONSTITUTION_PROMPT);
    expect(experiment.messages.map((message) => message.content).join('\n'))
      .toContain(SAME_CALL_MINIMAL_QUESTION_PROMPT);
    expect(production.messages.map((message) => message.content).join('\n'))
      .not.toContain('After the reading, write exactly one');
    expect(SAME_CALL_MINIMAL_QUESTION_PROMPT).not.toContain('Director');
    expect(SAME_CALL_MINIMAL_QUESTION_PROMPT).not.toContain('evidence_ids');
    expect(SAME_CALL_MINIMAL_QUESTION_PROMPT).not.toContain('no_question');
    expect(SAME_CALL_MINIMAL_QUESTION_PROMPT).not.toContain('living_edge');
    expect(SAME_CALL_MINIMAL_QUESTION_PROMPT).not.toContain('Τι αλλάζει');
    expect(SAME_CALL_MINIMAL_QUESTION_PROMPT).toContain('live point does not require conflict');
    expect(SAME_CALL_MINIMAL_QUESTION_PROMPT).toContain('fresh contact');
    expect(SAME_CALL_MINIMAL_QUESTION_PROMPT).toContain('Change only the angle of attention');
    expect(SAME_CALL_MINIMAL_QUESTION_PROMPT).toContain('Do not force any particular question form');
    expect(SAME_CALL_MINIMAL_QUESTION_PROMPT).toContain('rank, compare, prioritize, select');
    expect(hashSameCallMinimalV11Bundle()).toBe(SAME_CALL_MINIMAL_V11_BUNDLE_SHA256);
    expect(hashSameCallMinimalBundle()).toBe(SAME_CALL_MINIMAL_BUNDLE_SHA256);
    expect(SAME_CALL_MINIMAL_BUNDLE_SHA256).toBe(
      '4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7'
    );
  });

  it('keeps v1.1 System 4 frozen and selectable for the paired gate', () => {
    const v11 = buildSameCallMinimalRequest({
      dream,
      depth: 'standard',
      outputLanguage: 'el',
      variant: 'v1.1.0',
    });
    const v12 = buildSameCallMinimalRequest({
      dream,
      depth: 'standard',
      outputLanguage: 'el',
      variant: 'v1.2.0',
    });
    expect(v11.messages.map((message) => message.content).join('\n'))
      .toContain(SAME_CALL_MINIMAL_V11_QUESTION_PROMPT);
    expect(v11.messages.map((message) => message.content).join('\n'))
      .not.toContain('live point does not require conflict');
    expect(v12.messages.map((message) => message.content).join('\n'))
      .toContain('live point does not require conflict');
    expect(v11.task).toBe(v12.task);
    expect(v11.temperature).toBe(v12.temperature);
  });

  it('uses production Reader configs and an explicit language/mode wrapper', () => {
    const quick = buildSameCallMinimalRequest({ dream, depth: 'quick', outputLanguage: 'el' });
    const standard = buildSameCallMinimalRequest({ dream, depth: 'standard', outputLanguage: 'zh' });
    const advanced = buildSameCallMinimalRequest({ dream, depth: 'advanced', outputLanguage: 'ja' });
    const productionQuick = buildInitialReflectionRequest(dream, 'quick');
    const productionAdvanced = buildInitialReflectionRequest(dream, 'advanced');
    expect(quick.task).toBe('interpretation_quick');
    expect(quick.temperature).toBe(productionQuick.temperature);
    expect(quick.tokenLimit).toBe(productionQuick.tokenLimit + SAME_CALL_MINIMAL_QUESTION_TOKEN_BUFFER);
    expect(standard.task).toBe('interpretation_standard');
    expect(advanced.task).toBe('interpretation_advanced');
    expect(advanced.temperature).toBe(productionAdvanced.temperature);
    expect(advanced.tokenLimit).toBe(productionAdvanced.tokenLimit + SAME_CALL_MINIMAL_QUESTION_TOKEN_BUFFER);
    expect(mapReadingDepthToQuestionMode('quick')).toBe('CORE');
    expect(mapReadingDepthToQuestionMode('standard')).toBe('CORE');
    expect(mapReadingDepthToQuestionMode('advanced')).toBe('DEEPER');
    expect(quick.messages.at(-1)?.content).toContain('<OUTPUT_LANGUAGE>\nel\n</OUTPUT_LANGUAGE>');
    expect(quick.messages.at(-1)?.content).toContain('<QUESTION_MODE>\nCORE\n</QUESTION_MODE>');
    expect(advanced.messages.at(-1)?.content).toContain('<OUTPUT_LANGUAGE>\nja\n</OUTPUT_LANGUAGE>');
    expect(advanced.messages.at(-1)?.content).toContain('<QUESTION_MODE>\nDEEPER\n</QUESTION_MODE>');
  });

  it('splits only the terminal interrogative sentence from leftover reading prose', () => {
    expect(looksLikeReflectiveQuestion('Πού μένει το κόκκινο κασκόλ;')).toBe(true);
    expect(splitSameCallReadingAndQuestion([
      '## Core Restoration',
      '',
      'The ridge holds the sunrise.',
      '',
      '## Dream Movement',
      '',
      'You sit without wanting anything else.',
      '',
      'What in the spreading light still asks you to remain?',
      '',
      '<!--END_DREAM_READING-->',
    ].join('\n'))).toEqual({
      reading: [
        '## Core Restoration',
        'The ridge holds the sunrise.',
        '## Dream Movement',
        'You sit without wanting anything else.',
      ].join('\n\n'),
      question: 'What in the spreading light still asks you to remain?',
    });
    expect(extractTerminalInterrogative([
      'Το κέντρο του ονείρου μοιάζει να είναι αυτή η πυκνή αναμονή πριν από την πρώτη κίνηση. Ο άγνωστος δεν σπάει τη σιωπή.',
      'Πώς φαίνεται μπροστά σου το τραπέζι τη στιγμή που δεν χωράει πια τίποτε άλλο;',
    ].join('\n'))).toEqual({
      prefix: 'Το κέντρο του ονείρου μοιάζει να είναι αυτή η πυκνή αναμονή πριν από την πρώτη κίνηση. Ο άγνωστος δεν σπάει τη σιωπή.',
      question: 'Πώς φαίνεται μπροστά σου το τραπέζι τη στιγμή που δεν χωράει πια τίποτε άλλο;',
    });
    expect(splitSameCallReadingAndQuestion([
      '发光的名字停在水面之上。',
      '你把发光的纸片轻轻盖在那杯水上时，手里的感觉是什么？',
    ].join('\n'))).toEqual({
      reading: '发光的名字停在水面之上。',
      question: '你把发光的纸片轻轻盖在那杯水上时，手里的感觉是什么？',
    });
    expect(looksLikeReflectiveQuestion(
      '海に浮いた「HOME」の揺れを見ているあなたの中で、どんな種類の帰り方がまだ岸辺にとどまっているのでしょう。'
    )).toBe(true);
  });

  it('lints disjunctions diagnostically without rewriting', () => {
    assertDisjunctionDictionaryCoversRegistry();
    expect(lintSameCallDisjunction('保护那杯水，还是让光靠近？', 'zh')).toHaveLength(1);
    expect(lintSameCallDisjunction('Πώς είναι ή κάτι άλλο;', 'el')).toHaveLength(1);
    expect(lintSameCallDisjunction('Is it the elevator or the parsley?', 'en')).toHaveLength(1);
    expect(lintSameCallDisjunction('Which image is strongest?', 'en')).toHaveLength(0);
    expect(questionOpenerFamily('Πώς μένει μέσα σου εκείνη η στιγμή;', 'el')).toBe('Πώς μένει μέσα');
  });

  it('stays out of production runtime imports', () => {
    [
      'src/services/ai.ts',
      'src/services/entitledAiService.ts',
      'supabase/functions/ai-entitlements-gateway/index.ts',
      'supabase/functions/_shared/billing-ai.ts',
    ].forEach((rel) => {
      const source = readFileSync(path.join(process.cwd(), rel), 'utf8');
      expect(source).not.toMatch(/sameCallMinimal/);
      expect(source).not.toMatch(/oneiros-same-call-minimal/);
    });
  });
});
