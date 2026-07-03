import { accent, backgrounds, borders, colors, surfaces, typography } from '../src/theme';
import fs from 'fs';
import path from 'path';

describe('theme color system', () => {
  it('keeps the restored pre-Psyche background, transparent cards, and sand waves', () => {
    expect(backgrounds.primary).toBe('#F4EFEA');
    expect(backgrounds.secondary).toBe('#EDE6DF');
    expect(backgrounds.tertiary).toBe('#F4EFE8');
    expect(backgrounds.card).toBe('#EDE6DF');
    expect(backgrounds.cardTransparent).toBe('rgba(237, 230, 223, 0.7)');
    expect(backgrounds.wave1).toBe('#DAD2C8');
    expect(backgrounds.wave2).toBe('#CFC6BA');
    expect(surfaces.glass).toBe('rgba(237, 230, 223, 0.7)');
    expect(surfaces.glassSoft).toBe('rgba(240, 229, 223, 0.5)');
    expect(borders.primary).toBe('#E2D8CC');
  });

  it('keeps the current primary button family unchanged', () => {
    expect(accent.buttonPrimary).toBe('#4B3158');
    expect(colors.buttonPrimary).toBe('#4B3158');
    expect(colors.buttonGradientTop).toBe('#4B3158');
    expect(colors.buttonGradientBottom).toBe('#65446F');
  });

  it('keeps Write on the restored wave background with a lower card-anchored mountain field', () => {
    const writeScreenSource = fs.readFileSync(
      path.join(__dirname, '../src/screens/WriteScreen.tsx'),
      'utf8'
    );
    const mountainWaveSource = fs.readFileSync(
      path.join(__dirname, '../src/components/ui/MountainWaveBackground.tsx'),
      'utf8'
    );

    expect(writeScreenSource).toContain('MountainWaveBackground');
    expect(writeScreenSource).toContain('const WRITE_MOUNTAIN_HEIGHT = 320;');
    expect(writeScreenSource).toContain('const mountainTop = mainCardBottom == null ? undefined : Math.max(0, mainCardBottom - mountainHeight);');
    expect(writeScreenSource).toContain('<MountainWaveBackground height={mountainHeight} top={mountainTop} lite />');
    expect(writeScreenSource).toContain('setMainCardBottom(y + height);');
    expect(writeScreenSource).toContain('surface: colors.cardGlass');
    expect(writeScreenSource).toContain('paddingBottom: 220');
    expect(writeScreenSource).toContain('<View style={{ height: spacing.lg }} />');
    expect(writeScreenSource).toContain('textStyle={styles.saveButtonText}');
    expect(writeScreenSource).not.toContain('DreamMountainsBackground');
    expect(writeScreenSource).not.toContain('compositionStage');
    expect(writeScreenSource).not.toContain('dreamBackgroundLayer');
    expect(writeScreenSource).not.toContain('voiceButtonShell');
    expect(writeScreenSource).not.toContain('buttonPrimaryMuted');
    expect(writeScreenSource).not.toContain('saveButtonTextDisabled');
    expect(writeScreenSource).not.toContain('PsycheScreenBackground');
    expect(writeScreenSource).not.toContain('surface: colors.backgroundTertiary');
    expect(mountainWaveSource).toContain('bottomOffset?: number;');
    expect(mountainWaveSource).toContain("top != null ? { top } : { bottom: bottomOffset }");
  });

  it('uses MountainWaveBackground across tab and section screens instead of the legacy Psyche wrapper', () => {
    const dreamDetailSource = fs.readFileSync(
      path.join(__dirname, '../src/screens/DreamDetailScreen.tsx'),
      'utf8'
    );
    const journalSource = fs.readFileSync(
      path.join(__dirname, '../src/screens/JournalScreen.tsx'),
      'utf8'
    );
    const insightsSource = fs.readFileSync(
      path.join(__dirname, '../src/screens/InsightsScreen.tsx'),
      'utf8'
    );
    const uiIndexSource = fs.readFileSync(
      path.join(__dirname, '../src/components/ui/index.ts'),
      'utf8'
    );

    expect(dreamDetailSource).toContain('const DREAM_DETAIL_MOUNTAIN_HEIGHT = 260;');
    expect(dreamDetailSource).toContain('<MountainWaveBackground height={DREAM_DETAIL_MOUNTAIN_HEIGHT} lite />');
    expect(dreamDetailSource).not.toContain('PsycheScreenBackground');
    expect(journalSource).toContain('const JOURNAL_MOUNTAIN_HEIGHT = 300;');
    expect(journalSource).toContain('<MountainWaveBackground height={JOURNAL_MOUNTAIN_HEIGHT} lite />');
    expect(journalSource).not.toContain('PsycheScreenBackground');
    expect(insightsSource).toContain('const INSIGHTS_MOUNTAIN_HEIGHT = 240;');
    expect(insightsSource).toContain('<MountainWaveBackground height={INSIGHTS_MOUNTAIN_HEIGHT} lite />');
    expect(insightsSource).not.toContain('PsycheScreenBackground');
    expect(uiIndexSource).not.toContain('PsycheScreenBackground');
  });

  it('keeps the bottom tab shelf softer than the heavier pill treatment', () => {
    const tabsSource = fs.readFileSync(
      path.join(__dirname, '../src/navigation/MainTabsNavigator.tsx'),
      'utf8'
    );

    expect(tabsSource).toContain('colors={[colors.backgroundSecondary, colors.navSurface]}');
    expect(tabsSource).toContain('shadowOpacity: 0.05');
    expect(tabsSource).toContain('opacity: 0.44');
    expect(tabsSource).not.toContain('shadowOpacity: 0.1');
  });

  it('restores the pre-Alegreya Inter and Cormorant type stack', () => {
    expect(typography.regular).toBe('Inter_400Regular');
    expect(typography.medium).toBe('Inter_500Medium');
    expect(typography.semibold).toBe('Inter_500Medium');
    expect(typography.bold).toBe('CormorantGaramond_600SemiBold');
    expect(typography.display).toBe('CormorantGaramond_600SemiBold');
    expect(typography.roles.ui).toBe('Inter_400Regular');
    expect(typography.roles.uiEmphasis).toBe('Inter_500Medium');
    expect(typography.roles.reflection).toBe('Inter_400Regular');
  });

  it('loads Inter fonts at app startup instead of Alegreya Sans', () => {
    const appSource = fs.readFileSync(path.join(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('@expo-google-fonts/inter');
    expect(appSource).toContain('Inter_400Regular');
    expect(appSource).toContain('Inter_500Medium');
    expect(appSource).not.toContain('AlegreyaSans');
    expect(appSource).not.toContain('@expo-google-fonts/alegreya-sans');
  });
});
