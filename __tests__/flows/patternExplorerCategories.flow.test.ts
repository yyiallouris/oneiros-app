/**
 * Flow coverage: documentation/flows-07-insights-reports.md
 * (Pattern Explorer category labels, recurrence copy, and restored archetypal category).
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

describe('Pattern Explorer categories flow', () => {
  it('uses the reviewer-approved category labels and recurrence copy', () => {
    const source = readFileSync(path.join(repoRoot, 'src/screens/PatternExplorerScreen.tsx'), 'utf8');

    expect(source).toContain('See what gathers, returns, and changes across your dreams.');
    expect(source).toContain("title: 'Images'");
    expect(source).toContain("title: 'Motifs'");
    expect(source).toContain("title: 'Emotional Atmosphere'");
    expect(source).toContain("title: 'Thresholds'");
    expect(source).toContain("title: 'Dream Landscapes'");
    expect(source).toContain("title: 'Archetypal Echoes'");
    expect(source).toContain("description: 'Images that return or gather weight across dreams'");
    expect(source).toContain("description: 'Human situations that reappear in changing forms'");
    expect(source).toContain("description: 'Ways your dreams approach, resist, or cross boundaries'");
    expect(source).toContain("sectionId: 'recurring-archetypes'");
    expect(source).toContain('overview.topArchetypalEchoes');
  });

  it('keeps section definitions image-near and renders section intro subtitles', () => {
    const constantsSource = readFileSync(path.join(repoRoot, 'src/constants/insightsSections.ts'), 'utf8');
    const sectionSource = readFileSync(path.join(repoRoot, 'src/screens/InsightsSectionScreen.tsx'), 'utf8');

    expect(constantsSource).toContain("thresholds: 'Thresholds'");
    expect(constantsSource).toContain('Figures, objects, and forms that carry weight in the dream');
    expect(constantsSource).toContain('Scenes that give form to recognizable human situations');
    expect(constantsSource).toContain('The felt emotional climate surrounding the dream');
    expect(constantsSource).toContain('Places or moments of passage, hesitation, and change');
    expect(constantsSource).toContain('Deeper patterns of human experience resonating through the dream');
    expect(sectionSource).toContain('INSIGHTS_SECTION_SUBTITLES');
    expect(sectionSource).toContain('sectionIntro');
    expect(sectionSource).toContain('<Text style={styles.subSectionLabel}>Single Appearances</Text>');
    expect(sectionSource).not.toContain('setSingleAppearancesExpanded');
    expect(sectionSource).not.toContain('setSingleMotifsExpanded');
    expect(sectionSource).not.toContain('setSingleAffectsExpanded');
  });
});
