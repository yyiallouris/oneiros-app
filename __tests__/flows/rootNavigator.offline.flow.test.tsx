/**
 * Flow coverage: documentation/flows-05-sync-offline.md (reconnect sync, offline session preservation, logout cleanup).
 */
import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { AppState, Linking } from 'react-native';

let authStateChangeHandler: ((event: string, session: any) => Promise<void> | void) | null = null;
let networkStateHandler: ((online: boolean) => Promise<void> | void) | null = null;

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockStorageInitialize = jest.fn();
const mockStorageClearAll = jest.fn();
const mockSyncUnsyncedDreams = jest.fn();
const mockFetchAndMergeDreams = jest.fn();
const mockFetchAndMergeInterpretations = jest.fn();
const mockSyncAll = jest.fn();
const mockGetUnsyncedDreams = jest.fn();
const mockIsOnline = jest.fn();
const mockOnNetworkStateChange = jest.fn();
const mockSyncBiometricFromRemote = jest.fn();
const mockIsBiometricEnabled = jest.fn();
const mockHasCompletedOnboarding = jest.fn();
const mockHasAcceptedLegalConsent = jest.fn();

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

jest.mock('@react-navigation/stack', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    createStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      Screen: ({ name, component: Component, children }: any) => (
        <>
          <Text>{`screen:${name}`}</Text>
          {typeof children === 'function' ? children({}) : Component ? <Component /> : null}
        </>
      ),
    }),
  };
});

jest.mock('../../src/navigation/MainTabsNavigator', () => ({
  MainTabsNavigator: () => null,
}));
jest.mock('../../src/navigation/OnboardingNavigator', () => () => null);
jest.mock('../../src/screens/DreamEditorScreen', () => () => null);
jest.mock('../../src/screens/InterpretationChatScreen', () => () => null);
jest.mock('../../src/screens/DreamDetailScreen', () => () => null);
jest.mock('../../src/screens/AuthScreen', () => () => null);
jest.mock('../../src/screens/LoginSupportScreen', () => () => null);
jest.mock('../../src/screens/SetPasswordScreen', () => () => null);
jest.mock('../../src/screens/BiometricLockScreen', () => () => null);
jest.mock('../../src/screens/LegalConsentScreen', () => () => null);
jest.mock('../../src/screens/AccountScreen', () => () => null);
jest.mock('../../src/screens/ContactScreen', () => () => null);
jest.mock('../../src/screens/PrivacyScreen', () => () => null);
jest.mock('../../src/screens/CalendarScreen', () => () => null);
jest.mock('../../src/screens/InsightsSectionScreen', () => () => null);
jest.mock('../../src/screens/InsightsJourneyScreen', () => () => null);
jest.mock('../../src/screens/JournalFilterScreen', () => () => null);
jest.mock('../../src/components/DevOfflineToggle', () => ({
  DevOfflineToggle: () => null,
}));

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}));

jest.mock('../../src/services/storageService', () => ({
  StorageService: {
    initialize: (...args: unknown[]) => mockStorageInitialize(...args),
    clearAll: (...args: unknown[]) => mockStorageClearAll(...args),
  },
}));

jest.mock('../../src/services/syncService', () => ({
  SyncService: {
    syncUnsyncedDreams: (...args: unknown[]) => mockSyncUnsyncedDreams(...args),
    fetchAndMergeDreams: (...args: unknown[]) => mockFetchAndMergeDreams(...args),
    fetchAndMergeInterpretations: (...args: unknown[]) => mockFetchAndMergeInterpretations(...args),
    syncAll: (...args: unknown[]) => mockSyncAll(...args),
  },
}));

jest.mock('../../src/services/localStorage', () => ({
  LocalStorage: {
    getUnsyncedDreams: (...args: unknown[]) => mockGetUnsyncedDreams(...args),
  },
}));

jest.mock('../../src/utils/network', () => ({
  isOnline: (...args: unknown[]) => mockIsOnline(...args),
  onNetworkStateChange: (...args: unknown[]) => mockOnNetworkStateChange(...args),
}));

jest.mock('../../src/services/biometricAuthService', () => ({
  syncBiometricFromRemote: (...args: unknown[]) => mockSyncBiometricFromRemote(...args),
  isBiometricEnabled: (...args: unknown[]) => mockIsBiometricEnabled(...args),
}));

jest.mock('../../src/services/onboardingService', () => ({
  hasCompletedOnboarding: (...args: unknown[]) => mockHasCompletedOnboarding(...args),
}));

jest.mock('../../src/services/legalConsentService', () => ({
  hasAcceptedLegalConsent: (...args: unknown[]) => mockHasAcceptedLegalConsent(...args),
}));

jest.mock('../../src/utils/authDeepLink', () => ({
  processAuthDeepLink: jest.fn().mockResolvedValue({ handled: false }),
  redactAuthUrl: (url: string | null) => url,
}));

import { RootNavigator } from '../../src/navigation/RootNavigator';

const session = {
  user: { id: 'user-1' },
};

const dream = {
  id: 'dream-1',
  date: '2025-04-01',
  content: 'Offline dream',
  createdAt: 't',
  updatedAt: 't',
};

let unmountCurrent: (() => void) | null = null;

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

async function drainAsyncWork(cycles = 6): Promise<void> {
  for (let index = 0; index < cycles; index += 1) {
    await act(async () => {
      jest.runOnlyPendingTimers();
      await flushMicrotasks();
    });
  }
}

async function renderNavigator(): Promise<void> {
  const view = render(<RootNavigator />);
  unmountCurrent = view.unmount;
  await drainAsyncWork();
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('RootNavigator offline flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    authStateChangeHandler = null;
    networkStateHandler = null;

    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    jest.spyOn(AppState, 'addEventListener').mockImplementation(
      () => ({ remove: jest.fn() }) as any
    );

    mockGetSession.mockResolvedValue({ data: { session } });
    mockOnAuthStateChange.mockImplementation((callback: typeof authStateChangeHandler) => {
      authStateChangeHandler = callback;
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    });

    mockStorageInitialize.mockResolvedValue(undefined);
    mockStorageClearAll.mockResolvedValue(undefined);
    mockSyncUnsyncedDreams.mockResolvedValue(undefined);
    mockFetchAndMergeDreams.mockResolvedValue([dream]);
    mockFetchAndMergeInterpretations.mockResolvedValue([]);
    mockSyncAll.mockResolvedValue(undefined);
    mockGetUnsyncedDreams.mockResolvedValue([]);
    mockIsOnline.mockResolvedValue(true);
    mockOnNetworkStateChange.mockImplementation((callback: typeof networkStateHandler) => {
      networkStateHandler = callback;
      return jest.fn();
    });
    mockSyncBiometricFromRemote.mockResolvedValue(false);
    mockIsBiometricEnabled.mockResolvedValue(false);
    mockHasCompletedOnboarding.mockResolvedValue(true);
    mockHasAcceptedLegalConsent.mockResolvedValue(true);
  });

  afterEach(async () => {
    unmountCurrent?.();
    unmountCurrent = null;
    await drainAsyncWork(2);
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('syncs queued dreams before fetching remote data when coming back online', async () => {
    mockIsOnline.mockResolvedValue(false);
    mockGetUnsyncedDreams
      .mockResolvedValueOnce([dream])
      .mockResolvedValueOnce([]);

    await renderNavigator();

    await waitFor(() => {
      expect(mockStorageInitialize).toHaveBeenCalled();
      expect(networkStateHandler).toBeTruthy();
    });

    await act(async () => {
      await networkStateHandler?.(true);
      await flushMicrotasks();
    });

    await waitFor(() => {
      expect(mockSyncUnsyncedDreams).toHaveBeenCalledTimes(1);
      expect(mockFetchAndMergeDreams).toHaveBeenCalledTimes(1);
      expect(mockFetchAndMergeInterpretations).toHaveBeenCalledTimes(1);
    });

    expect(mockSyncUnsyncedDreams.mock.invocationCallOrder[0]).toBeLessThan(
      mockFetchAndMergeDreams.mock.invocationCallOrder[0]
    );
    expect(mockFetchAndMergeDreams.mock.invocationCallOrder[0]).toBeLessThan(
      mockFetchAndMergeInterpretations.mock.invocationCallOrder[0]
    );
  });

  it('preserves the existing session when auth becomes null while offline', async () => {
    mockIsOnline
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await renderNavigator();

    await waitFor(() => expect(mockStorageInitialize).toHaveBeenCalled());
    expect(authStateChangeHandler).toBeTruthy();

    await act(async () => {
      await authStateChangeHandler?.('TOKEN_REFRESHED', null);
      await flushMicrotasks();
    });

    expect(mockStorageClearAll).not.toHaveBeenCalled();
    expect(mockSyncUnsyncedDreams).not.toHaveBeenCalled();
  });

  it('attempts a final sync before clearing local data on logout', async () => {
    mockIsOnline
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    mockGetUnsyncedDreams.mockResolvedValue([dream]);

    await renderNavigator();

    await waitFor(() => expect(mockStorageInitialize).toHaveBeenCalled());
    expect(authStateChangeHandler).toBeTruthy();

    await act(async () => {
      await authStateChangeHandler?.('SIGNED_OUT', null);
      await flushMicrotasks();
    });

    await waitFor(() => {
      expect(mockSyncUnsyncedDreams).toHaveBeenCalledTimes(1);
      expect(mockStorageClearAll).toHaveBeenCalledTimes(1);
    });

    expect(mockSyncUnsyncedDreams.mock.invocationCallOrder[0]).toBeLessThan(
      mockStorageClearAll.mock.invocationCallOrder[0]
    );
  });

  it('does not flash legal consent while login route state is still loading', async () => {
    const legalConsent = deferred<boolean>();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockHasAcceptedLegalConsent.mockReturnValue(legalConsent.promise);

    const view = render(<RootNavigator />);
    unmountCurrent = view.unmount;
    await drainAsyncWork();

    expect(view.queryByText('screen:Auth')).toBeTruthy();

    await act(async () => {
      const loginPromise = authStateChangeHandler?.('SIGNED_IN', session);
      await flushMicrotasks();

      expect(view.queryByText('screen:LegalConsent')).toBeNull();
      expect(view.queryByText('screen:MainTabs')).toBeNull();

      legalConsent.resolve(true);
      await loginPromise;
      await flushMicrotasks();
    });

    await waitFor(() => {
      expect(view.queryByText('screen:LegalConsent')).toBeNull();
      expect(view.getByText('screen:MainTabs')).toBeTruthy();
    });
  });

  it('does not flash legal consent during cold start before stored consent resolves', async () => {
    const legalConsent = deferred<boolean>();
    mockHasAcceptedLegalConsent.mockReturnValue(legalConsent.promise);

    const view = render(<RootNavigator />);
    unmountCurrent = view.unmount;

    await drainAsyncWork();

    expect(view.queryByText('screen:LegalConsent')).toBeNull();
    expect(view.queryByText('screen:MainTabs')).toBeNull();

    await act(async () => {
      legalConsent.resolve(true);
      await flushMicrotasks();
    });
    await drainAsyncWork();

    await waitFor(() => {
      expect(view.queryByText('screen:LegalConsent')).toBeNull();
      expect(view.getByText('screen:MainTabs')).toBeTruthy();
    });
  });
});
