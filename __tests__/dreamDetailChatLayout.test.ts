import { readFileSync } from 'fs';
import path from 'path';
import {
  DREAM_DETAIL_CHAT_SCROLL_MAX_HEIGHT,
  dreamDetailChatScrollViewStyle,
} from '../src/screens/dreamDetailChatLayout';

const repoRoot = path.resolve(__dirname, '..');

describe('dreamDetailChatLayout', () => {
  it('keeps a bounded nested chat height without overflow:hidden', () => {
    expect(dreamDetailChatScrollViewStyle.maxHeight).toBe(DREAM_DETAIL_CHAT_SCROLL_MAX_HEIGHT);
    expect(dreamDetailChatScrollViewStyle.flexGrow).toBe(0);
    expect(dreamDetailChatScrollViewStyle).not.toHaveProperty('overflow');

    const screen = readFileSync(path.join(repoRoot, 'src/screens/DreamDetailScreen.tsx'), 'utf8');
    expect(screen).toMatch(/No overflow:'hidden' \/ flex:1/);
    expect(screen).toMatch(/chatScrollViewStreaming/);
    const chatSectionBlock = screen.match(/chatSection:\s*\{([\s\S]*?)\n\s*\},?\n\s*chatHeader:/)?.[1] ?? '';
    expect(chatSectionBlock).toBeTruthy();
    expect(chatSectionBlock).not.toMatch(/^\s*overflow:\s*'hidden'/m);
    expect(chatSectionBlock).not.toMatch(/^\s*flex:\s*1/m);
  });
});
