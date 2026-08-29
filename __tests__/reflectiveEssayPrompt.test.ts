import {
  buildEssayCompressionRetryPrompt,
  buildPeriodReflectionSystemPrompt,
  buildPeriodReflectionUserPrompt,
  buildRecentDreamFieldUserPrompt,
  countRenderedEssayWords,
  END_MARKER_DREAM_ESSAY,
  essayExceedsHardMaximum,
  essayExceedsRetryTolerance,
  ESSAY_CONTEXT_VERSION,
  getPeriodEssayLengthPolicy,
  PERIOD_REFLECTION_PROMPT_ID,
  PERIOD_REFLECTION_PROMPT_VERSION,
  RECENT_DREAM_FIELD_LENGTH_POLICY,
  RECENT_DREAM_FIELD_PROMPT_ID,
  RECENT_DREAM_FIELD_PROMPT_VERSION,
  RECENT_DREAM_FIELD_SYSTEM_PROMPT,
} from '../src/ai/reflectiveEssayPrompt';

describe('reflective essay v2 prompt contract', () => {
  it('freezes the accepted Phase 1 prompt and production context', () => {
    expect(PERIOD_REFLECTION_PROMPT_ID).toBe('oneiros-period-reflection-v2');
    expect(PERIOD_REFLECTION_PROMPT_VERSION).toBe('2.0.4-phase1');
    expect(RECENT_DREAM_FIELD_PROMPT_ID).toBe('oneiros-recent-dream-field-v2');
    expect(RECENT_DREAM_FIELD_PROMPT_VERSION).toBe('2.0.4-phase1');
    expect(ESSAY_CONTEXT_VERSION).toBe(1);
  });

  it('uses scope-aware weekly and monthly headings', () => {
    const weekly = buildPeriodReflectionSystemPrompt('weekly', 3);
    const monthly = buildPeriodReflectionSystemPrompt('monthly', 3);

    expect(weekly).toContain("## The Week's Dream Field");
    expect(weekly).toContain('## Movement Across the Week');
    expect(monthly).toContain("## The Month's Dream Field");
    expect(monthly).toContain('## Movement Across the Month');
  });

  it('does not force conflict or coherence and outputs exactly two reflective questions', () => {
    const prompt = buildPeriodReflectionSystemPrompt('monthly', 5);

    expect(prompt).toMatch(/tension, contradiction, or lack of coherence/);
    expect(prompt).toContain('Conflict is one possible organizing quality, never the default');
    expect(prompt).toContain('If no coherent organization is well supported, do not manufacture one');
    expect(prompt).toContain('Exactly 2 questions as markdown bullets');
    expect(prompt).not.toContain('canonical reflective-question method');
    expect(prompt).not.toContain('Output 1–2 questions');
    expect(prompt).toContain('Once chosen, preserve that topology throughout every section and the reflective question');
    expect(prompt).toContain('Do not use a question to invent a cross-dream relation');
  });

  it('requires concrete evidence before unifying dreams while preserving ambition', () => {
    const prompt = buildPeriodReflectionSystemPrompt('monthly', 6);

    expect(prompt).toContain('A shared field must be earned by concrete cross-dream evidence.');
    expect(prompt).toContain('one supported field, multiple parallel/local clusters, or a loose field');
    expect(prompt).toContain('Once chosen, preserve that topology throughout every section');
    expect(prompt).toContain('An opening disclaimer does not license contradictory synthesis');
    expect(prompt).toContain(
      'generic qualities such as attention, restraint, presence, proportion, care, openness, agency, or non-interference'
    );
    expect(prompt).toContain('Quoting one concrete anchor from each dream does not make the bridge concrete.');
    expect(prompt).toContain('Abstract equivalence is not recurrence.');
    expect(prompt).toContain('comparable situation → comparable affective stance → comparable action or response');
    expect(prompt).toContain('a broad paraphrase cannot supply a missing link');
    expect(prompt).toContain('A common image with opposed responses');
    expect(prompt).toContain('If the bridge exists mainly at the interpretive level');
    expect(prompt).toContain('No unified field is a successful reading.');
    expect(prompt).toContain('Do not subordinate them to a master thesis.');
    expect(prompt).toContain('Chronology is not development.');
    expect(prompt).toContain('Do not default to fragmentation or perform skepticism.');
    expect(prompt).toContain('name it clearly and follow it with full interpretive ambition');
    expect(prompt).toContain('Do not use a question to invent a cross-dream relation');
  });

  it('lets fixed sections express no field, parallel clusters, and no temporal development', () => {
    const period = buildPeriodReflectionSystemPrompt('monthly', 6);

    expect(period).toContain('present only supported local affinities or parallel clusters');
    expect(period).toContain('If chronological order is clear but development is not supported');
    expect(RECENT_DREAM_FIELD_SYSTEM_PROMPT).toContain(
      'A loose recent sequence may have no shared current pulse.'
    );
    expect(RECENT_DREAM_FIELD_SYSTEM_PROMPT).toContain(
      'If nothing returns with enough concrete density, say so directly'
    );
    expect(RECENT_DREAM_FIELD_SYSTEM_PROMPT).toContain(
      'Their chronological order may be clear without supporting development'
    );
  });

  it('uses semantic section proportions without numeric per-section quotas', () => {
    const prompt = buildPeriodReflectionSystemPrompt('monthly', 5);

    expect(prompt).toContain('Brief opening');
    expect(prompt).toContain('The main body');
    expect(prompt).toContain('Shorter than the main body');
    expect(prompt).not.toMatch(/\b\d+[–-]\d+ words per section\b/i);
    expect(prompt).not.toMatch(/section.{0,30}\b\d+[–-]\d+ words\b/i);
  });

  it('keeps Recent distinct from a completed monthly reflection', () => {
    expect(RECENT_DREAM_FIELD_SYSTEM_PROMPT).toContain(
      'Read the dreams as a recent sequence, not as a completed calendar period.'
    );
    expect(RECENT_DREAM_FIELD_SYSTEM_PROMPT).toContain('This is not a miniature monthly essay.');
    expect(RECENT_DREAM_FIELD_SYSTEM_PROMPT).toContain('## Current Movement');
    expect(RECENT_DREAM_FIELD_SYSTEM_PROMPT).not.toContain('Movement Across the Month');
  });

  it('selects compact whole-essay length policies by dream count', () => {
    expect(getPeriodEssayLengthPolicy(1)).toEqual({
      target: '250–300 words',
      hardMaximum: 350,
      retryToleranceCeiling: 375,
    });
    expect(getPeriodEssayLengthPolicy(4).hardMaximum).toBe(550);
    expect(getPeriodEssayLengthPolicy(5).hardMaximum).toBe(700);
    expect(RECENT_DREAM_FIELD_LENGTH_POLICY).toEqual({
      target: '300–380 words',
      hardMaximum: 425,
      retryToleranceCeiling: 450,
    });
  });

  it('counts rendered body words while excluding headings and the hidden marker', () => {
    const essay = `## Recent Dream Field\nOne two three.\n\n## Reflective Questions\n- Four five?\n\n${END_MARKER_DREAM_ESSAY}`;

    expect(countRenderedEssayWords(essay, 'en')).toBe(5);
  });

  it('allows one compact retry with tolerance and never instructs truncation', () => {
    const policy = { target: '4–5 words', hardMaximum: 5, retryToleranceCeiling: 6 };
    const fiveWords = 'one two three four five';
    const sixWords = `${fiveWords} six`;
    const sevenWords = `${sixWords} seven`;
    const retry = buildEssayCompressionRetryPrompt(policy);

    expect(essayExceedsHardMaximum(fiveWords, policy, 'en')).toBe(false);
    expect(essayExceedsHardMaximum(sixWords, policy, 'en')).toBe(true);
    expect(essayExceedsRetryTolerance(sixWords, policy, 'en')).toBe(false);
    expect(essayExceedsRetryTolerance(sevenWords, policy, 'en')).toBe(true);
    expect(retry).toContain('Rewrite the entire essay from scratch');
    expect(retry).toContain(
      'Preserve the complete reflective-question section with exactly two questions.'
    );
    expect(retry).toContain('Never cut a sentence or question to satisfy the word limit.');
    expect(retry).not.toMatch(/truncate|string truncation/i);
  });

  it('builds field-level user prompts from the supplied Phase 1 context', () => {
    const context = 'Symbol stances: door: guarded\nInterpretation excerpt: A possible threshold.';
    const period = buildPeriodReflectionUserPrompt({
      scope: 'weekly',
      scopeKey: '2026-08-17:2026-08-23',
      startDate: '2026-08-17',
      endDate: '2026-08-23',
      dreamCount: 3,
      context,
      languageInstruction: 'Write body text in Greek.',
    });
    const recent = buildRecentDreamFieldUserPrompt({
      dreamCount: 3,
      context,
      languageInstruction: 'Write body text in Greek.',
    });

    expect(period).toContain('You are writing a weekly Dream Field reflection.');
    expect(period).toContain('Date range: 2026-08-17 to 2026-08-23');
    expect(period).toContain(context);
    expect(recent).toContain('Scope: latest 3 reflected dreams');
    expect(recent).toContain(context);
  });
});
