import { spacing } from './spacing';

/**
 * Layout tokens for readable content width — especially Expo web on wide viewports.
 * Mobile native keeps full-bleed screens; web centers a phone-scale column.
 */
export const layout = {
  /** Primary app column max width on web (phone-comfortable reading line). */
  contentMaxWidth: 480,
  /** Slightly wider column when the browser is tablet-wide but not desktop. */
  contentMaxWidthTablet: 560,
  /** Minimum outer gutter when the browser is wider than the column. */
  webOuterGutter: 24,
  /** Viewport width at/above which the tablet column max may apply. */
  tabletMinWidth: 700,
  /** Viewport width at/above which we lock to the phone-scale column. */
  desktopMinWidth: 960,
} as const;

/**
 * Floating parchment tab shelf. Keep `MainTabsNavigator` and tab-screen
 * footers/CTAs on these tokens so Save-style actions cannot slip under the nav.
 */
export const floatingTabBar = {
  /** Compact enough to stay quiet while preserving 44dp+ tab touch targets. */
  height: 74,
  /** Extra lift above the safe-area inset (`tabBarStyle.bottom` beyond `insets.bottom`). */
  bottomOffset: 14,
  horizontalInset: 24,
  borderRadius: 31,
  /** Quiet paper gap between a tab-screen CTA and the top of the shelf. */
  contentGap: spacing.md,
} as const;

/**
 * Resolve the web content column width for a given browser width.
 * Narrow viewports stay full-bleed; wide ones center a capped column.
 */
export function resolveWebContentWidth(windowWidth: number): number {
  if (!Number.isFinite(windowWidth) || windowWidth <= 0) {
    return layout.contentMaxWidth;
  }

  const available = Math.max(0, windowWidth - layout.webOuterGutter * 2);

  if (windowWidth < layout.tabletMinWidth) {
    return Math.min(windowWidth, layout.contentMaxWidth);
  }

  if (windowWidth < layout.desktopMinWidth) {
    return Math.min(available, layout.contentMaxWidthTablet);
  }

  return Math.min(available, layout.contentMaxWidth);
}

export function isWebContentConstrained(windowWidth: number): boolean {
  return windowWidth > layout.contentMaxWidth;
}

export function resolveFloatingTabBarBottom(safeAreaBottom: number): number {
  const inset = Number.isFinite(safeAreaBottom) ? Math.max(0, safeAreaBottom) : 0;
  return inset + floatingTabBar.bottomOffset;
}

/** Distance from the screen bottom to the top of the floating tab shelf. */
export function resolveFloatingTabBarOccupancy(safeAreaBottom: number): number {
  return resolveFloatingTabBarBottom(safeAreaBottom) + floatingTabBar.height;
}

/** Padding so tab-screen content and CTAs sit fully above the shelf. */
export function resolveFloatingTabBarContentInset(
  safeAreaBottom: number,
  extraGap: number = floatingTabBar.contentGap
): number {
  const gap = Number.isFinite(extraGap) ? Math.max(0, extraGap) : floatingTabBar.contentGap;
  return resolveFloatingTabBarOccupancy(safeAreaBottom) + gap;
}
