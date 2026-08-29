import {
  floatingTabBar,
  isWebContentConstrained,
  layout,
  resolveFloatingTabBarBottom,
  resolveFloatingTabBarContentInset,
  resolveFloatingTabBarOccupancy,
  resolveWebContentWidth,
} from '../src/theme/layout';
import { spacing } from '../src/theme/spacing';

describe('web layout tokens', () => {
  it('keeps narrow phone browsers full-bleed up to the phone max', () => {
    expect(resolveWebContentWidth(390)).toBe(390);
    expect(resolveWebContentWidth(480)).toBe(layout.contentMaxWidth);
    expect(isWebContentConstrained(390)).toBe(false);
  });

  it('widens slightly on tablet widths for comfortable reading', () => {
    expect(resolveWebContentWidth(800)).toBe(layout.contentMaxWidthTablet);
    expect(isWebContentConstrained(800)).toBe(true);
  });

  it('locks to the phone-scale column on desktop widths', () => {
    expect(resolveWebContentWidth(1440)).toBe(layout.contentMaxWidth);
    expect(resolveWebContentWidth(1920)).toBe(layout.contentMaxWidth);
    expect(isWebContentConstrained(1440)).toBe(true);
  });

  it('never exceeds available width after outer gutters', () => {
    // Just above tabletMinWidth with little room after gutters.
    const width = layout.tabletMinWidth;
    const expected = Math.min(
      width - layout.webOuterGutter * 2,
      layout.contentMaxWidthTablet
    );
    expect(resolveWebContentWidth(width)).toBe(expected);
  });
});

describe('floating tab bar clearance', () => {
  it('keeps occupancy and CTA inset aligned with the parchment shelf geometry', () => {
    expect(floatingTabBar.contentGap).toBe(spacing.md);

    expect(resolveFloatingTabBarBottom(0)).toBe(floatingTabBar.bottomOffset);
    expect(resolveFloatingTabBarBottom(34)).toBe(34 + floatingTabBar.bottomOffset);
    expect(resolveFloatingTabBarOccupancy(0)).toBe(
      floatingTabBar.bottomOffset + floatingTabBar.height
    );

    const contentInset = resolveFloatingTabBarContentInset(0);
    expect(contentInset).toBe(
      floatingTabBar.bottomOffset + floatingTabBar.height + floatingTabBar.contentGap
    );
    expect(contentInset).toBeGreaterThan(resolveFloatingTabBarOccupancy(0));
  });

  it('treats invalid safe-area values as zero instead of drifting the shelf', () => {
    expect(resolveFloatingTabBarBottom(Number.NaN)).toBe(floatingTabBar.bottomOffset);
    expect(resolveFloatingTabBarBottom(-12)).toBe(floatingTabBar.bottomOffset);
    expect(resolveFloatingTabBarContentInset(0, Number.NaN)).toBe(
      resolveFloatingTabBarOccupancy(0) + floatingTabBar.contentGap
    );
  });
});
