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
    expect(primaryButton.active.opacity).toBe(1);
    expect(primaryButton.active.shadowOpacity).toBe(0.05);
    expect(primaryButtonText.active.color).toBe(colors.onAccent);
  });

  it('uses Save dream disabled treatment for primary buttons', () => {
    expect(primaryButton.disabled.backgroundColor).toBe(colors.buttonPrimary90);
    expect(primaryButton.disabled.borderColor).toBe(colors.buttonEdge);
    expect(primaryButton.disabled.opacity).toBe(0.68);
    expect(primaryButtonText.disabled.color).toBe(colors.onAccent);
  });

  it('uses the same active/inactive treatment for icon buttons', () => {
    expect(primaryIconButton.active.backgroundColor).toBe(colors.buttonPrimary90);
    expect(primaryIconButton.inactive.backgroundColor).toBe(colors.buttonPrimary90);
    expect(primaryIconButton.inactive.borderColor).toBe(colors.buttonEdge);
    expect(primaryIconButton.inactive.opacity).toBe(0.68);
  });

  it('defines compact size used by Save dream', () => {
    expect(buttonSizes.compact.minHeight).toBe(46);
    expect(buttonSizes.compact.borderRadius).toBe(18);
  });
});
