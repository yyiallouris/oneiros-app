/**
 * Flow coverage: documentation/flows-07-insights-reports.md
 * (backend Recent Dream Field and period reflection prompt parity).
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

describe('edge pattern essay prompt flow', () => {
  it('keeps client and gateway essays on the shared psychological-aliveness contract', () => {
    const billingAi = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts'), 'utf8');
    const clientAi = readFileSync(path.join(repoRoot, 'src/services/ai.ts'), 'utf8');
    const essayPrompt = readFileSync(path.join(repoRoot, 'src/ai/reflectiveEssayPrompt.ts'), 'utf8');

    expect(clientAi).toMatch(/from '\.\.\/ai\/reflectiveEssayPrompt'/);
    expect(billingAi).toMatch(/from '\.\.\/\.\.\/\.\.\/src\/ai\/reflectiveEssayPrompt\.ts'/);
    expect(clientAi).toMatch(/buildPeriodReflectionSystemPrompt/);
    expect(billingAi).toMatch(/buildPeriodReflectionSystemPrompt/);
    expect(essayPrompt).toMatch(/Read the dreams as a field across this/);
    expect(essayPrompt).toMatch(/Read the dreams as a recent sequence, not as a completed calendar period/);
    expect(essayPrompt).toMatch(/what is most psychologically alive or generative/);
    expect(essayPrompt).toMatch(/Conflict is one possible organizing quality, never the default/);
    expect(essayPrompt).toMatch(
      /Output exactly one reflective question selected through the canonical reflective-question method adapted to a multi-dream field/
    );
    expect(essayPrompt).toMatch(/One strong question is complete/);
    expect(essayPrompt).not.toMatch(/Output 1–2 questions, maximum 2/);
    expect(essayPrompt).toMatch(/Preserve the chosen field topology in the question/);
    expect(essayPrompt).not.toMatch(/from '\.\/reflectiveQuestionPrompt'/);
    expect(billingAi).toMatch(
      /role: 'system' as const,\s*content: RECENT_DREAM_FIELD_SYSTEM_PROMPT,\s*\},\s*\{\s*role: 'user' as const,/
    );
    expect(billingAi).toMatch(
      /content: buildPeriodReflectionSystemPrompt\(scope\.kind, entries\.length\),\s*\},\s*\{\s*role: 'user' as const,/
    );
    expect(essayPrompt).not.toMatch(/Exactly 2 questions/);
    expect(essayPrompt).toMatch(/No advice verbs such as try, practice, breathe, relax, focus, improve, or work on/);
    expect(billingAi).toMatch(/END_MARKER_DREAM_ESSAY/);
    expect(billingAi).toMatch(/stripEndMarker\((primary|retry)MarkedContent, END_MARKER_DREAM_ESSAY\)/);
    expect(essayPrompt).toMatch(/PERIOD_REFLECTION_PROMPT_VERSION = '2\.0\.3-phase1'/);
    expect(essayPrompt).toMatch(/RECENT_DREAM_FIELD_PROMPT_VERSION = '2\.0\.3-phase1'/);
    expect(essayPrompt).toMatch(/ESSAY_CONTEXT_VERSION = 1/);
    expect(essayPrompt).toMatch(/A shared field must be earned by concrete cross-dream evidence/);
    expect(essayPrompt).toMatch(/Quoting one concrete anchor from each dream does not make the bridge concrete/);
    expect(essayPrompt).toMatch(/Field topology comes before interpretation/);
    expect(essayPrompt).toMatch(/Once chosen, preserve that topology throughout every section/);
    expect(essayPrompt).toMatch(/Abstract equivalence is not recurrence/);
    expect(essayPrompt).toMatch(/comparable situation → comparable affective stance → comparable action or response/);
    expect(essayPrompt).toMatch(/No unified field is a successful reading/);
    expect(essayPrompt).toMatch(/Do not subordinate them to a master thesis/);
    expect(essayPrompt).toMatch(/Chronology is not development/);
  });

  it('keeps client and gateway on the shared metadata-first Phase 1 context', () => {
    const billingAi = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts'), 'utf8');
    const clientAi = readFileSync(path.join(repoRoot, 'src/services/ai.ts'), 'utf8');
    const contextBuilder = readFileSync(path.join(repoRoot, 'src/ai/reflectiveEssayContext.ts'), 'utf8');
    const essayPrompt = readFileSync(path.join(repoRoot, 'src/ai/reflectiveEssayPrompt.ts'), 'utf8');

    expect(billingAi).toMatch(/buildMetadataFirstEssayContext/);
    expect(clientAi).toMatch(/buildMetadataFirstEssayContext/);
    expect(contextBuilder).toMatch(/buildMetadataFirstEssayContext/);
    expect(contextBuilder).toMatch(/Affects:/);
    expect(contextBuilder).toMatch(/Symbols:/);
    expect(contextBuilder).toMatch(/Symbol stances:/);
    expect(contextBuilder).toMatch(/Landscapes:/);
    expect(contextBuilder).toMatch(/Relational dynamics:/);
    expect(contextBuilder).toMatch(/Interpretation excerpt:/);
    expect(contextBuilder).toMatch(/Core Mode:/);
    expect(contextBuilder).toMatch(/Motifs:/);
    expect(contextBuilder).toMatch(/Thresholds:/);
    expect(contextBuilder).toMatch(/Central conflicts:/);
    expect(contextBuilder).toMatch(/Archetypal Echoes:/);
    expect(contextBuilder).toMatch(/Mythic Echoes:/);
    expect(essayPrompt).toMatch(/A previous interpretation excerpt may carry concrete dream detail/);
    expect(billingAi).toMatch(/buildEssayLanguageInstruction/);
    expect(billingAi).toMatch(/Keep all markdown section headings exactly as specified in English for UI consistency/);

    expect(contextBuilder).toMatch(/surface === 'recent' \? 520 : 650/);
    expect(contextBuilder).toMatch(/buildNarrativeFirstEssayContext/);
    expect(billingAi).not.toMatch(/buildNarrativeFirstEssayContext/);
    expect(clientAi).not.toMatch(/buildNarrativeFirstEssayContext/);
  });

  it('keeps the frozen prompt scope-aware and limits recovery to compact whole-essay rewriting', () => {
    const billingAi = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts'), 'utf8');
    const clientAi = readFileSync(path.join(repoRoot, 'src/services/ai.ts'), 'utf8');
    const gateway = readFileSync(
      path.join(repoRoot, 'supabase/functions/ai-entitlements-gateway/index.ts'),
      'utf8'
    );
    const essayPrompt = readFileSync(path.join(repoRoot, 'src/ai/reflectiveEssayPrompt.ts'), 'utf8');

    expect(essayPrompt).toMatch(/The Week's Dream Field/);
    expect(essayPrompt).toMatch(/The Month's Dream Field/);
    expect(billingAi).toMatch(/kind: Extract<PeriodEssayScope, 'weekly' \| 'monthly'>/);
    expect(gateway).toMatch(/period_kind: scope\.kind/);

    expect(clientAi).toMatch(/initialTooLong = essayExceedsHardMaximum/);
    expect(billingAi).toMatch(/primaryTooLong = essayExceedsHardMaximum/);
    expect(clientAi).toMatch(/pattern_insights_retry_compact/);
    expect(billingAi).toMatch(/task: 'pattern_insights_retry_compact'/);
    expect(essayPrompt).toMatch(/Rewrite the entire essay from scratch in a compact complete form/);
    expect(essayPrompt).toMatch(/Never cut a sentence or question to satisfy the word limit/);
    expect(clientAi).not.toMatch(/stripEndMarker\([^\n]+\)\.slice\(/);
    expect(billingAi).not.toMatch(/stripEndMarker\([^\n]+\)\.slice\(/);
  });
});
