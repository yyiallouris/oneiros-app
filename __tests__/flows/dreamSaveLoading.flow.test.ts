/**
 * Flow coverage: documentation/flows-04-dreams-journal-calendar.md
 * (save dream feedback should not flash the reflection-style loader for fast local saves).
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

describe('Dream save loading flow', () => {
  it('delays visible save loading while disabling save immediately on Write and Editor', () => {
    const writeScreen = readFileSync(path.join(repoRoot, 'src/screens/WriteScreen.tsx'), 'utf8');
    const editorScreen = readFileSync(path.join(repoRoot, 'src/screens/DreamEditorScreen.tsx'), 'utf8');

    for (const source of [writeScreen, editorScreen]) {
      expect(source).toMatch(/SAVE_LOADING_REVEAL_DELAY_MS = 450/);
      expect(source).toMatch(/const \[showSaveLoading, setShowSaveLoading\] = useState\(false\)/);
      expect(source).toMatch(/setTimeout\(\(\) => \{\s*setShowSaveLoading\(true\);/);
      expect(source).toMatch(/loading=\{showSaveLoading\}/);
      expect(source).toMatch(/setShowSaveLoading\(false\)/);
    }

    expect(writeScreen).toMatch(/disabled=\{isSaveInactive \|\| isSaving\}/);
    expect(editorScreen).toMatch(/disabled=\{!content\.trim\(\) \|\| isSaving\}/);
  });
});
