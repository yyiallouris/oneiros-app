import { backgrounds, colors, subscriptionCards, surfaces, typography } from '../src/theme';
import fs from 'fs';
import path from 'path';

describe('theme color system', () => {
  it('keeps the new paper-first background and floating parchment nav tokens', () => {
    expect(backgrounds.primary).toBe('#F8F3EA');
    expect(backgrounds.secondary).toBe('#F3ECE2');
    expect(backgrounds.tertiary).toBe('#FCF7F0');
    expect(backgrounds.splash).toBe('#F8F3EA');
    expect(surfaces.nav).toBe('#FFFDF9');
    expect(surfaces.conversationDock).toBe('rgba(255, 253, 249, 0.86)');
    expect(surfaces.navBorder).toBe('rgba(222, 211, 223, 0.35)');
    expect(colors.navSurface).toBe('#FFFDF9');
    expect(colors.conversationDockSurface).toBe('rgba(255, 253, 249, 0.86)');
    expect(colors.navBorder).toBe('rgba(222, 211, 223, 0.35)');
    expect(colors.tabIconActive).toBe('#4B3158');
    expect(colors.tabIconInactive).toBe('#756A79');
    expect(colors.symbolicInk).toBe('#000000');
  });

  it('uses PaperBackground across the active shell while keeping legacy wave exports available', () => {
    const writeScreenSource = fs.readFileSync(
      path.join(__dirname, '../src/screens/WriteScreen.tsx'),
      'utf8'
    );
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

    expect(writeScreenSource).toContain('PaperBackground');
    expect(writeScreenSource).not.toContain('MountainWaveBackground');
    expect(dreamDetailSource).toContain('PaperBackground');
    expect(journalSource).toContain('PaperBackground');
    expect(insightsSource).toContain('PaperBackground');
    expect(uiIndexSource).toContain("export { PaperBackground } from './PaperBackground';");
    expect(uiIndexSource).toContain("export { LegacyWaveBackground } from './WaveBackground';");
    expect(uiIndexSource).toContain("export { LegacyMountainWaveBackground } from './MountainWaveBackground';");
  });

  it('uses the paper tab shelf with the harmonized feather, organic Journal, and dot-free Insights eye', () => {
    const tabsSource = fs.readFileSync(
      path.join(__dirname, '../src/navigation/MainTabsNavigator.tsx'),
      'utf8'
    );
    const navigationIconsSource = fs.readFileSync(
      path.join(__dirname, '../src/components/icons/NavigationIcons.tsx'),
      'utf8'
    );
    const dreamDetailSource = fs.readFileSync(
      path.join(__dirname, '../src/screens/DreamDetailScreen.tsx'),
      'utf8'
    );

    expect(tabsSource).toContain('backgroundColor: colors.navSurface');
    expect(dreamDetailSource).toContain('backgroundColor: colors.conversationDockSurface');
    expect(dreamDetailSource).not.toContain('backgroundColor: colors.navSurface');
    expect(tabsSource).toContain('borderColor: colors.navBorder');
    expect(tabsSource).toContain('<WriteTabIcon');
    expect(tabsSource).toContain('<JournalTabIcon');
    expect(tabsSource).toContain('<InsightsTabIcon');
    expect(navigationIconsSource).toContain("require('../../assets/icons/tab-icons/write_nav_ink_v2.png')");
    expect(navigationIconsSource).toContain('writePressureUnderlay');
    expect(tabsSource).not.toContain("require('../assets/icons/tab-icons/write_active.png')");
    expect(tabsSource).not.toContain("require('../assets/icons/tab-icons/write_inactive.png')");
    expect(tabsSource).not.toContain("require('../assets/icons/tab-icons/journal_active.png')");
    expect(navigationIconsSource).toContain("require('../../assets/icons/tab-icons/insights_nav_eye_ink.png')");
    expect(navigationIconsSource).toContain('top: 330');
    expect(tabsSource).not.toContain('oneiros_insight_returning_images_sheet_extract_rgba_900.png');
    expect(tabsSource).not.toContain("require('../assets/icons/tab-icons/inighsts_active.png')");
    expect(tabsSource).not.toContain("require('../assets/icons/tab-icons/inisghts_inactive.png')");
    expect(tabsSource).not.toContain('LinearGradient');
    expect(tabsSource).not.toContain('write_tab.svg');
    expect(tabsSource).not.toContain('journal_tab.svg');
    expect(tabsSource).not.toContain('insights_tab.svg');
  });

  it('keeps subscription cards on one continuous surface per tier', () => {
    expect(subscriptionCards.premiumBackgroundTop).toBe(subscriptionCards.premiumBackgroundBottom);
    expect(subscriptionCards.deeperBackgroundUndertone).toBe(subscriptionCards.deeperBackground);
  });

  it('keeps the restored Inter and Cormorant type stack', () => {
    expect(typography.regular).toBe('Inter_400Regular');
    expect(typography.medium).toBe('Inter_500Medium');
    expect(typography.semibold).toBe('Inter_500Medium');
    expect(typography.bold).toBe('CormorantGaramond_600SemiBold');
    expect(typography.display).toBe('CormorantGaramond_600SemiBold');
    expect(typography.roles.ui).toBe('Inter_400Regular');
    expect(typography.roles.uiEmphasis).toBe('Inter_500Medium');
    expect(typography.roles.uiStrong).toBe('Inter_500Medium');
    expect(typography.roles.screenTitle).toBe('Inter_500Medium');
    expect(typography.roles.navigationTitle).toBe('Inter_500Medium');
    expect(typography.roles.control).toBe('Inter_400Regular');
    expect(typography.roles.metadata).toBe('Inter_400Regular');
    expect(typography.roles.dreamTitle).toBe('CormorantGaramond_600SemiBold');
    expect(typography.roles.innerVoice).toBe('CormorantGaramond_600SemiBold');
    expect(typography.roles.reflection).toBe('CormorantGaramond_600SemiBold');
  });

  it('keeps shared cards quiet with one contour and no decorative inset layers', () => {
    const cardSource = fs.readFileSync(
      path.join(__dirname, '../src/components/ui/Card.tsx'),
      'utf8'
    );

    expect(cardSource).toContain('borderColor: colors.contourLineFaint');
    expect(cardSource).toContain('shadowOpacity: 0.05');
    expect(cardSource).not.toContain('styles.edgeGlow');
    expect(cardSource).not.toContain('styles.innerBorder');
  });

  it('still loads Inter fonts at app startup', () => {
    const appSource = fs.readFileSync(path.join(__dirname, '../App.tsx'), 'utf8');

    expect(appSource).toContain('@expo-google-fonts/inter');
    expect(appSource).toContain('Inter_400Regular');
    expect(appSource).toContain('Inter_500Medium');
  });
});
