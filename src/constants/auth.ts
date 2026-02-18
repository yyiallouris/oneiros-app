/** AsyncStorage key: set after user opens password-reset link; cleared after they set a new password. */
export const PENDING_PASSWORD_RESET_KEY = 'pendingPasswordReset';

/** Minimum password length (Supabase default 6; 8 is recommended for security). */
export const MIN_PASSWORD_LENGTH = 8;

/** AsyncStorage key: true when user has enabled app lock (require biometric to open app). */
export const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';
