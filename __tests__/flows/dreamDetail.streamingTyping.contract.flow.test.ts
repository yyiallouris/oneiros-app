/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * → “Locked UX contract: reflection streaming typing”
 *
 * USER APPROVAL REQUIRED to weaken these assertions.
 * Agents previously removed PhasedTypingText while “fixing” stream visibility.
 * That is forbidden. Fix layout/resume — keep typing.
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

describe('DreamDetail streaming typing contract (locked UX)', () => {
  const dreamDetailScreen = read('src/screens/DreamDetailScreen.tsx');
  const phasedTypingText = read('src/components/ui/PhasedTypingText.tsx');
  const entitledAi = read('src/services/entitledAiService.ts');
  const flowDoc = read('documentation/flows-06-jungian-ai-reflection.md');
  const agents = read('AGENTS.md');
  const skill = read('.codex/skills/oneiros-repo/SKILL.md');

  it('documents the lock and requires explicit user approval to change typing/streaming UX', () => {
    expect(flowDoc).toMatch(/Locked UX contract: reflection streaming typing/);
    expect(flowDoc).toMatch(/Do not change without the product owner.s explicit approval/);
    expect(flowDoc).toMatch(/Forbidden without explicit user approval/);
    expect(flowDoc).toMatch(/Replacing streamed `PhasedTypingText` with instant full text/);

    expect(agents).toMatch(/UX And Product Contracts Require Explicit Approval/);
    expect(agents).toMatch(/DreamDetail live reflection \*\*typing \/ streaming reveal\*\*/);
    expect(agents).toMatch(/Never replace streamed `PhasedTypingText` with instant full-text dumps/);

    expect(skill).toMatch(/USER APPROVAL REQUIRED/);
    expect(skill).toMatch(/DreamDetail reflection typing\/streaming/);
    expect(skill).toMatch(/FormattedMessageText/);
    expect(skill).toMatch(/PhasedTypingText/);
    expect(skill).toMatch(/explicitly approves/);
  });

  it('keeps ~15s partial reveal and wires streaming + settle through PhasedTypingText', () => {
    expect(entitledAi).toMatch(/export const REFLECTION_PARTIAL_REVEAL_AFTER_MS = 15000/);
    expect(dreamDetailScreen).toMatch(/REFLECTION_PARTIAL_REVEAL_AFTER_MS/);
    expect(dreamDetailScreen).toMatch(/isStreaming\?: boolean/);
    expect(dreamDetailScreen).toMatch(/\(isTyping \|\| isStreaming\) && !isUser/);
    expect(dreamDetailScreen).toMatch(/<PhasedTypingText/);
    expect(dreamDetailScreen).toMatch(/isStreaming=\{streamingReflectionMessageId === item\.id && isGeneratingInitial\}/);

    // Forbidden shortcut that previously deleted typing during stream.
    expect(dreamDetailScreen).not.toMatch(
      /isStreaming && !isUser \?\s*\(\s*<FormattedMessageText/
    );
    expect(dreamDetailScreen).not.toMatch(
      /Live gateway partials: show full text immediately/
    );
  });

  it('keeps append-aware typing with catch-up and does not kill the timer on every partial', () => {
    expect(phasedTypingText).toMatch(/formatInterpretationMarkdown/);
    expect(phasedTypingText).toMatch(/const isAppendOnlyUpdate = isNormalizedAppend \|\| isRawAppend/);
    expect(phasedTypingText).toMatch(/CATCH_UP_BEHIND_WORDS/);
    expect(phasedTypingText).toMatch(/WORD_DELAY_CATCH_UP_MS/);
    expect(phasedTypingText).toMatch(
      /Keep an already-running timer alive across append-only partial updates/
    );
  });

  it('keeps Exploring chat layout fixes without sacrificing typing', () => {
    expect(dreamDetailScreen).toMatch(/No overflow:'hidden' \/ flex:1/);
    expect(dreamDetailScreen).toMatch(/chatScrollViewStreaming/);
    const chatSectionBlock =
      dreamDetailScreen.match(/chatSection:\s*\{([\s\S]*?)\n\s*\},?\n\s*chatHeader:/)?.[1] ?? '';
    expect(chatSectionBlock).toBeTruthy();
    expect(chatSectionBlock).not.toMatch(/^\s*overflow:\s*'hidden'/m);
    expect(chatSectionBlock).not.toMatch(/^\s*flex:\s*1/m);
  });
});
