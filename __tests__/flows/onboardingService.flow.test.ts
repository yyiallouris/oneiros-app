/**
 * Flow coverage: documentation/flows-03-onboarding-account-security.md
 */
jest.mock('../../src/services/userService', () => ({
  UserService: {
    getCurrentUserId: jest.fn(),
    getStoredUserId: jest.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasCompletedOnboarding, setOnboardingCompleted } from '../../src/services/onboardingService';
import { UserService } from '../../src/services/userService';

const uid = (UserService.getCurrentUserId as jest.Mock);
const sid = (UserService.getStoredUserId as jest.Mock);

describe('onboardingService flow', () => {
  beforeEach(() => {
    (AsyncStorage as any).clear?.();
    uid.mockReset();
    sid.mockReset();
  });

  it('hasCompletedOnboarding is false when no user id', async () => {
    uid.mockResolvedValue(null);
    sid.mockResolvedValue(null);
    await expect(hasCompletedOnboarding()).resolves.toBe(false);
  });

  it('setOnboardingCompleted then hasCompletedOnboarding is true for that user', async () => {
    uid.mockResolvedValue('user-42');
    sid.mockResolvedValue('user-42');
    await setOnboardingCompleted();
    await expect(hasCompletedOnboarding()).resolves.toBe(true);
  });

  it('different user id does not inherit onboarding flag', async () => {
    uid.mockResolvedValue('user-a');
    sid.mockResolvedValue('user-a');
    await setOnboardingCompleted();
    uid.mockResolvedValue('user-b');
    sid.mockResolvedValue('user-b');
    await expect(hasCompletedOnboarding()).resolves.toBe(false);
  });

  it('uses stored user id when current session id missing', async () => {
    uid.mockResolvedValue(null);
    sid.mockResolvedValue('offline-user');
    await setOnboardingCompleted();
    uid.mockResolvedValue(null);
    sid.mockResolvedValue('offline-user');
    await expect(hasCompletedOnboarding()).resolves.toBe(true);
  });
});
