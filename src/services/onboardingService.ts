import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserService } from './userService';

const ONBOARDING_COMPLETED_KEY_PREFIX = '@onboarding_completed_';

function onboardingKey(userId: string): string {
  return `${ONBOARDING_COMPLETED_KEY_PREFIX}${userId}`;
}

/** Read the local onboarding flag when the authenticated user ID is already known. */
export async function hasCompletedOnboardingForUser(userId: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(onboardingKey(userId));
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Check if the current user has completed onboarding.
 * Returns false if not logged in or onboarding not completed.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    let userId = await UserService.getCurrentUserId();
    if (!userId) userId = await UserService.getStoredUserId();
    if (!userId) return false;
    return hasCompletedOnboardingForUser(userId);
  } catch {
    return false;
  }
}

/**
 * Mark onboarding as completed for the current user.
 */
export async function setOnboardingCompleted(): Promise<void> {
  try {
    let userId = await UserService.getCurrentUserId();
    if (!userId) userId = await UserService.getStoredUserId();
    if (!userId) return;
    await AsyncStorage.setItem(onboardingKey(userId), 'true');
  } catch {
    // Ignore
  }
}
