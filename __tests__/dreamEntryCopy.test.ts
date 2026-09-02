import fs from 'fs';

describe('dream entry guidance copy', () => {
  it('uses the concise approved memory prompt on both writing surfaces', () => {
    const writeScreen = fs.readFileSync('src/screens/WriteScreen.tsx', 'utf8');
    const dreamEditorScreen = fs.readFileSync('src/screens/DreamEditorScreen.tsx', 'utf8');

    [writeScreen, dreamEditorScreen].forEach((source) => {
      expect(source).toContain('placeholder="Write it as you remember it."');
      expect(source).not.toContain('without correcting');
    });
  });
});
