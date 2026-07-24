/**
 * Flow coverage: documentation/flows-07-insights-reports.md
 * (backend Recent Dream Field and period reflection prompt parity).
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

describe('edge pattern essay prompt flow', () => {
  it('keeps gateway Recent Dream Field and period essays aligned with the canonical June 9 prompt contract', () => {
    const billingAi = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts'), 'utf8');
    const clientAi = readFileSync(path.join(repoRoot, 'src/services/ai.ts'), 'utf8');

    expect(clientAi).toMatch(/You are Dream Weaver, a post-Jungian dream essayist reviewing a month of dreams/);
    expect(clientAi).toMatch(/You are Dream Weaver, a post-Jungian dream essayist reviewing the user's latest reflected dreams as a short recent sequence/);

    expect(billingAi).toMatch(/Keep these Recent Dream Field and period essay contracts in parity with src\/services\/ai\.ts/);
    expect(billingAi).toMatch(/const MONTHLY_DREAM_ESSAY_SYSTEM_PROMPT =/);
    expect(billingAi).toMatch(/const RECENT_DREAM_FIELD_SYSTEM_PROMPT =/);
    expect(billingAi).toMatch(/Read the dreams as a field, not as isolated events/);
    expect(billingAi).toMatch(/Read the dreams as a recent sequence, not as a completed calendar period/);
    expect(billingAi).toMatch(/The essay should feel synthesized from images and movements, not generated from tags/);
    expect(billingAi).toMatch(/The reflection should feel synthesized from images and movements, not generated from metadata/);
    expect(billingAi).toMatch(/Every major claim must be grounded in at least one concrete recurrence/);
    expect(billingAi).toMatch(/Exactly 2 questions/);
    expect(billingAi).toMatch(/No advice verbs like try, practice, breathe, relax, focus, or work on/);
    expect(billingAi).toMatch(/END_MARKER_DREAM_ESSAY/);
    expect(billingAi).toMatch(/stripEndMarker\(extractContent\(payload\), END_MARKER_DREAM_ESSAY\)/);
  });

  it('passes the full canonical context fields into gateway pattern essays', () => {
    const billingAi = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts'), 'utf8');

    expect(billingAi).toMatch(/Core Mode:/);
    expect(billingAi).toMatch(/Symbol stances:/);
    expect(billingAi).toMatch(/Landscapes:/);
    expect(billingAi).toMatch(/Relational dynamics:/);
    expect(billingAi).toMatch(/Central conflicts:/);
    expect(billingAi).toMatch(/Amplifications:/);
    expect(billingAi).toMatch(/Use interpretation excerpts only to deepen the synthesis, not to repeat the original readings/);
    expect(billingAi).toMatch(/buildEssayLanguageInstruction/);
    expect(billingAi).toMatch(/Keep all markdown section headings exactly as specified in English for UI consistency/);
  });
});
