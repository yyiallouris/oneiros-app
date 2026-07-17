/**
 * Auth UI smoke (see documentation/flows-02-authentication.md).
 */
import { device, element, by, expect } from 'detox';

describe('Auth flow', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('shows auth screen and buttons', async () => {
    await expect(element(by.text('Sign in'))).toBeVisible();
    if (device.getPlatform() === 'ios') {
      await expect(element(by.text('Continue with Apple'))).toBeVisible();
    }
    await expect(element(by.text('Continue with Google'))).toBeVisible();
    await expect(element(by.text('Continue with Discord'))).toBeVisible();
  });

  it('opens forgot password screen', async () => {
    await element(by.text('Forgot password?')).tap();
    await expect(element(by.text('Send reset link'))).toBeVisible();
  });
});

