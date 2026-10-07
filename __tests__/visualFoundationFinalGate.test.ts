import fs from 'fs';
import { colors, oneirosPalette } from '../src/theme';

const relativeLuminance = (hex: string): number => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const contrastRatio = (foreground: string, background: string): number => {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

describe('Oneiros v1.3.0 visual foundation final gate', () => {
  it('keeps essential text on AA-safe ink roles and reserves soft plum for inactive artwork', () => {
    expect(contrastRatio(oneirosPalette.INK, oneirosPalette.SURFACE)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(oneirosPalette.INK_MUTED, oneirosPalette.SURFACE)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(oneirosPalette.PLUM, oneirosPalette.SURFACE)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#FFFFFF', oneirosPalette.PLUM)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(oneirosPalette.PLUM_SOFT, oneirosPalette.SURFACE)).toBeLessThan(4.5);

    expect(colors.textMuted).toBe(oneirosPalette.INK_MUTED);
    expect(colors.tabIconInactive).toBe(oneirosPalette.PLUM_SOFT);

    const tabs = fs.readFileSync('src/navigation/MainTabsNavigator.tsx', 'utf8');
    expect(tabs).toContain('focused ? colors.tabIconActive : colors.textSecondary');
  });

  it('keeps the audited Write and Insights interaction targets at 44dp or larger', () => {
    const write = fs.readFileSync('src/screens/WriteScreen.tsx', 'utf8');
    const insights = fs.readFileSync('src/screens/InsightsScreen.tsx', 'utf8');

    expect(write).toMatch(/titleInput:\s*\{\s*minHeight: 44,/);
    expect(write).toMatch(/headerLeft:\s*\{\s*width: 44,\s*minHeight: 44,/);
    expect(write).toContain('accessibilityLabel="Open menu"');
    expect(insights).toMatch(/recentScopeChip:\s*\{[\s\S]*?minHeight: 44,/);
    expect(insights).toMatch(/recentLockedCtaWrap:\s*\{[\s\S]*?minHeight: 44,/);
  });

  it('keeps the final consistency corrections on shared visual tokens', () => {
    const write = fs.readFileSync('src/screens/WriteScreen.tsx', 'utf8');
    const journal = fs.readFileSync('src/screens/JournalScreen.tsx', 'utf8');
    const webShell = fs.readFileSync('src/components/ui/WebContentShell.tsx', 'utf8');

    expect(write).not.toContain("color: 'rgba(45, 36, 48");
    expect(write).toContain('borderRadius: borderRadius.lg');
    expect(journal).toContain('backgroundColor: colors.cardGlassSoft');
    expect(webShell).toContain('borderColor: colors.navBorder');
    expect(webShell).toContain('${colors.shadow}');
  });
});
