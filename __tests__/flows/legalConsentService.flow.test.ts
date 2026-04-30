/**
 * Flow coverage: documentation/flows-08-support-legal-contact.md
 */
jest.mock('../../src/services/userService', () => ({
  UserService: {
    getCurrentUserId: jest.fn(),
    getStoredUserId: jest.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEGAL_CONSENT_VERSION } from '../../src/constants/legal';
import { hasAcceptedLegalConsent, setLegalConsentAccepted } from '../../src/services/legalConsentService';
import { UserService } from '../../src/services/userService';

const uid = UserService.getCurrentUserId as jest.Mock;
const sid = UserService.getStoredUserId as jest.Mock;

describe('legalConsentService flow', () => {
  beforeEach(() => {
    (AsyncStorage as any).clear?.();
    uid.mockReset();
    sid.mockReset();
  });

  it('hasAcceptedLegalConsent is false when no user id', async () => {
    uid.mockResolvedValue(null);
    sid.mockResolvedValue(null);
    await expect(hasAcceptedLegalConsent()).resolves.toBe(false);
  });

  it('stores the current consent version per user', async () => {
    uid.mockResolvedValue('user-42');
    sid.mockResolvedValue('user-42');

    await setLegalConsentAccepted();

    await expect(hasAcceptedLegalConsent()).resolves.toBe(true);
    const stored = await AsyncStorage.getItem('@legal_consent_user-42');
    expect(stored).toContain(LEGAL_CONSENT_VERSION);
  });

  it('does not inherit consent across users', async () => {
    uid.mockResolvedValue('user-a');
    sid.mockResolvedValue('user-a');
    await setLegalConsentAccepted();

    uid.mockResolvedValue('user-b');
    sid.mockResolvedValue('user-b');
    await expect(hasAcceptedLegalConsent()).resolves.toBe(false);
  });

  it('uses stored user id when current session id is missing', async () => {
    uid.mockResolvedValue(null);
    sid.mockResolvedValue('offline-user');
    await setLegalConsentAccepted();

    uid.mockResolvedValue(null);
    sid.mockResolvedValue('offline-user');
    await expect(hasAcceptedLegalConsent()).resolves.toBe(true);
  });
});
