import fs from 'fs';

describe('Oneiros v1.3.0 visual-foundation corrective patch', () => {
  it('forces the repeated paper image to fill its owning background plane', () => {
    const paperBackground = fs.readFileSync(
      'src/components/ui/PaperBackground.tsx',
      'utf8',
    );

    expect(paperBackground).toContain("width: '100%'");
    expect(paperBackground).toContain("height: '100%'");
    expect(paperBackground).toContain('resizeMode="repeat"');
  });

  it('keeps the Write date chip without the redundant decorative rule above it', () => {
    const writeScreen = fs.readFileSync('src/screens/WriteScreen.tsx', 'utf8');

    expect(writeScreen).toContain('styles.datePill');
    expect(writeScreen).not.toContain('paperRuleTop');
  });
});
