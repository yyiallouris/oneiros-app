import {
  backgrounds,
  colors,
  oneirosPalette,
  subscriptionCards,
  surfaces,
  typography,
} from '../src/theme';
import fs from 'fs';
import path from 'path';

describe('theme color system', () => {
  it('routes the approved D2.5 direction through exactly seven primitives', () => {
    expect(oneirosPalette).toEqual({
      PAPER: '#F3ECE2',
      SURFACE: '#FAF7F1',
      INK: '#342A38',
      INK_MUTED: '#6B606C',
      PLUM: '#5E4566',
      PLUM_SOFT: '#897B8C',
      BORDER: '#E4DCD2',
    });
    expect(Object.keys(oneirosPalette)).toHaveLength(7);

    expect(backgrounds.primary).toBe(oneirosPalette.PAPER);
    expect(backgrounds.secondary).toBe(oneirosPalette.SURFACE);
    expect(backgrounds.tertiary).toBe(oneirosPalette.SURFACE);
    expect(backgrounds.card).toBe(oneirosPalette.SURFACE);
    expect(backgrounds.splash).toBe(oneirosPalette.PAPER);
    expect(surfaces.nav).toBe(oneirosPalette.SURFACE);
    expect(surfaces.conversationDock).toBe('rgba(250, 247, 241, 0.86)');
    expect(surfaces.navBorder).toBe(oneirosPalette.BORDER);
    expect(colors.navSurface).toBe(oneirosPalette.SURFACE);
    expect(colors.conversationDockSurface).toBe('rgba(250, 247, 241, 0.86)');
    expect(colors.navBorder).toBe(oneirosPalette.BORDER);
    expect(colors.tabIconActive).toBe(oneirosPalette.PLUM);
    expect(colors.cardBackground).toBe(oneirosPalette.SURFACE);
    expect(colors.textPrimary).toBe(oneirosPalette.INK);
    expect(colors.textSecondary).toBe(oneirosPalette.INK_MUTED);
    expect(colors.textMuted).toBe(oneirosPalette.INK_MUTED);
    expect(colors.tabIconInactive).toBe(oneirosPalette.PLUM_SOFT);
    expect(colors.symbolicInk).toBe(oneirosPalette.INK);
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
    expect(navigationIconsSource).toContain('const width = WRITE_BOUNDS.width * heightScale');
    expect(navigationIconsSource).not.toContain('writePressureUnderlay');
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
