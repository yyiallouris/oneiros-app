import {
  primaryButton,
  primaryButtonText,
  primaryIconButton,
  buttonSizes,
} from '../src/theme/buttons';
import { colors } from '../src/theme';

describe('button theme tokens', () => {
  it('uses Save dream active colors for primary buttons', () => {
    expect(primaryButton.active.backgroundColor).toBe(colors.buttonPrimary90);
    expect(primaryButton.active.borderColor).toBe(colors.buttonEdge);
    expect(primaryButtonText.active.color).toBe(colors.white);
  });

  it('uses Save dream disabled colors for primary buttons', () => {
    expect(primaryButton.disabled.backgroundColor).toBe(colors.buttonPrimaryDisabledLight);
    expect(primaryButton.disabled.borderColor).toBe(colors.buttonPrimaryDisabledBorder);
    expect(primaryButtonText.disabled.color).toBe(colors.buttonPrimaryDisabled);
  });

  it('uses the same active/disabled treatment for icon buttons', () => {
    expect(primaryIconButton.active.backgroundColor).toBe(colors.buttonPrimary90);
    expect(primaryIconButton.inactive.backgroundColor).toBe(colors.buttonPrimaryDisabledLight);
    expect(primaryIconButton.inactive.borderColor).toBe(colors.buttonPrimaryDisabledBorder);
  });

  it('defines compact size used by Save dream', () => {
    expect(buttonSizes.compact.minHeight).toBe(46);
    expect(buttonSizes.compact.borderRadius).toBe(18);
  });
});
