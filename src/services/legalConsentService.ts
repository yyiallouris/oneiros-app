import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEGAL_CONSENT_VERSION } from '../constants/legal';
import { UserService } from './userService';

const LEGAL_CONSENT_KEY_PREFIX = '@legal_consent_';

function legalConsentKey(userId: string): string {
  return `${LEGAL_CONSENT_KEY_PREFIX}${userId}`;
}

async function getUserId(): Promise<string | null> {
  let userId = await UserService.getCurrentUserId();
  if (!userId) userId = await UserService.getStoredUserId();
  return userId;
}

export async function hasAcceptedLegalConsent(): Promise<boolean> {
  try {
    const userId = await getUserId();
    if (!userId) return false;
    const value = await AsyncStorage.getItem(legalConsentKey(userId));
    if (!value) return false;

    const parsed = JSON.parse(value) as { version?: string };
    return parsed.version === LEGAL_CONSENT_VERSION;
  } catch {
    return false;
  }
}

export async function setLegalConsentAccepted(): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;
    await AsyncStorage.setItem(
      legalConsentKey(userId),
      JSON.stringify({
        version: LEGAL_CONSENT_VERSION,
        acceptedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    throw error;
  }
}
