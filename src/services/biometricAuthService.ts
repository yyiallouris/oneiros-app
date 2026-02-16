import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { remoteSetBiometricEnabled, remoteGetBiometricEnabled } from './remoteStorage';
import { BIOMETRIC_ENABLED_KEY } from '../constants/auth';

export type BiometricType = 'fingerprint' | 'face' | 'none';

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  type: BiometricType;
  canUse: boolean;
}

/**
 * Check if the device supports biometrics and has enrolled data.
 */
export async function getBiometricStatus(): Promise<BiometricStatus> {
  try {
    const [hasHardware, isEnrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const type: BiometricType = hasFace ? 'face' : hasFingerprint ? 'fingerprint' : 'none';
    const canUse = hasHardware && isEnrolled && type !== 'none';
    return { hasHardware, isEnrolled, type, canUse };
  } catch {
    return { hasHardware: false, isEnrolled: false, type: 'none', canUse: false };
  }
}

/**
 * Whether the user has enabled app lock (require biometric to open app).
 * Reads from local AsyncStorage only.
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Load biometric_enabled from Supabase (user_settings) and write to AsyncStorage.
 * Call when the user has a session (e.g. on login) so the preference persists across logout/login.
 */
export async function syncBiometricFromRemote(): Promise<boolean> {
  try {
    const enabled = await remoteGetBiometricEnabled();
    if (enabled) {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    }
    return enabled;
  } catch {
    return false;
  }
}

/**
 * Enable app lock: prompt for biometric to confirm, then save preference.
 * Call when user is already logged in.
 */
export async function enableBiometric(): Promise<{ success: boolean; error?: string }> {
  try {
    const status = await getBiometricStatus();
    if (!status.canUse) {
      return { success: false, error: 'Biometrics not available or not enrolled on this device.' };
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to lock the app with ' + getBiometricLabel(status.type),
      cancelLabel: 'Cancel',
    });
    if (!result.success) {
      const msg = result.error === 'user_cancel' ? 'Cancelled' : result.error ?? 'Authentication failed';
      return { success: false, error: msg };
    }
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    await remoteSetBiometricEnabled(true);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Failed to enable app lock' };
  }
}

/**
 * Disable app lock: clear preference.
 */
export async function disableBiometric(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    await remoteSetBiometricEnabled(false);
  } catch {
    // best effort
  }
}

/**
 * Prompt for biometric unlock. Use when user has app lock enabled and must unlock to use the app.
 * Returns true if user passed, false if cancelled or failed.
 */
export async function requireBiometricUnlock(promptMessage?: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage ?? 'Unlock to open the app',
      cancelLabel: 'Cancel',
    });
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Label for the biometric type (for UI).
 */
export function getBiometricLabel(type: BiometricType): string {
  switch (type) {
    case 'face':
      return 'Face ID';
    case 'fingerprint':
      return 'Fingerprint';
    default:
      return 'Biometrics';
  }
}
