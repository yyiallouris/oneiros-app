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
