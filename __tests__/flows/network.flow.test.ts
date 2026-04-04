/**
 * Flow coverage: documentation/flows-05-sync-offline.md (forced offline).
 */
import * as Network from 'expo-network';
import { waitFor } from '@testing-library/react-native';
import { isOnline, setForceOfflineMode, onNetworkStateChange } from '../../src/utils/network';

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

const mockGetNetworkState = Network.getNetworkStateAsync as jest.Mock;

describe('network flow', () => {
  afterEach(() => {
    setForceOfflineMode(false);
    mockGetNetworkState.mockReset();
    jest.useRealTimers();
  });

  it('setForceOfflineMode forces isOnline false', async () => {
    mockGetNetworkState.mockResolvedValue({ isConnected: true });
    setForceOfflineMode(true);
    await expect(isOnline()).resolves.toBe(false);
  });

  it('when not forced, reflects expo-network isConnected (cache expires)', async () => {
    jest.useFakeTimers();
    setForceOfflineMode(false);
    mockGetNetworkState.mockResolvedValue({ isConnected: true });
    await expect(isOnline()).resolves.toBe(true);
    mockGetNetworkState.mockResolvedValue({ isConnected: false });
    jest.advanceTimersByTime(6000);
    await expect(isOnline()).resolves.toBe(false);
  });

  it('onNetworkStateChange invokes callback with current state', async () => {
    setForceOfflineMode(false);
    mockGetNetworkState.mockResolvedValue({ isConnected: true });
    const cb = jest.fn();
    const unsub = onNetworkStateChange(cb);
    await waitFor(() => expect(cb).toHaveBeenCalledWith(true));
    unsub();
  });
});
