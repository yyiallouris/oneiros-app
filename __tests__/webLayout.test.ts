import { isWebContentConstrained, layout, resolveWebContentWidth } from '../src/theme/layout';

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
