import * as Network from 'expo-network';

let cachedOnlineState: boolean | null = null;
let lastCheckTime = 0;
const CACHE_DURATION = 5000; // Cache for 5 seconds

// FOR TESTING: Set to true to force offline mode
// This allows testing offline functionality without disabling network
let FORCE_OFFLINE_MODE = false;

/**
 * FOR TESTING ONLY: Force offline mode
 * Set to true to simulate offline, false to use real network state
 */
export function setForceOfflineMode(forceOffline: boolean): void {
  FORCE_OFFLINE_MODE = forceOffline;
  // Clear cache so it takes effect immediately
  cachedOnlineState = null;
  lastCheckTime = 0;
  console.log(`[Network] Force offline mode: ${forceOffline}`);
}

/**
 * Check if device is currently online
 * Uses expo-network for accurate network state detection
 */
export async function isOnline(): Promise<boolean> {
  // FOR TESTING: If force offline is enabled, always return false
  if (FORCE_OFFLINE_MODE) {
    return false;
  }

  const now = Date.now();
  
  // Return cached result if still valid
  if (cachedOnlineState !== null && (now - lastCheckTime) < CACHE_DURATION) {
    return cachedOnlineState;
  }

  try {
    const networkState = await Network.getNetworkStateAsync();
    const isConnected = networkState.isConnected ?? false;
    const previousState = cachedOnlineState;
    cachedOnlineState = isConnected;
    lastCheckTime = now;
    
    // Log state changes for debugging
    if (previousState !== null && previousState !== isConnected && __DEV__) {
      console.log(`[Network] Connection state changed: ${previousState ? 'ONLINE' : 'OFFLINE'} → ${isConnected ? 'ONLINE' : 'OFFLINE'}`);
    }
    
    return isConnected;
  } catch (error) {
    // If network detection fails, assume offline for safety
    console.warn('[Network] Failed to check network state:', error);
    cachedOnlineState = false;
    lastCheckTime = now;
    return false;
  }
}

/**
 * Subscribe to network state changes
 * Returns a function to unsubscribe
 * 
 * Uses polling every 3 seconds to detect network state changes
 */
export function onNetworkStateChange(
  callback: (isConnected: boolean) => void
): () => void {
  let isSubscribed = true;
  let wasOnline: boolean | null = null;

  // Poll network state every 2 seconds (more responsive)
  const interval = setInterval(async () => {
    if (!isSubscribed) {
      clearInterval(interval);
      return;
    }
    
    try {
      const online = await isOnline();
      
      // Only call callback if state changed
      if (wasOnline !== online) {
        if (__DEV__) {
          console.log(`[Network] Poll detected state change: ${wasOnline !== null ? (wasOnline ? 'ONLINE' : 'OFFLINE') : 'UNKNOWN'} → ${online ? 'ONLINE' : 'OFFLINE'}`);
        }
        wasOnline = online;
        callback(online);
      }
    } catch (error) {
      // If check fails, don't crash - just skip this poll
      console.warn('[Network] Error in network state poll:', error);
    }
  }, 2000); // Poll every 2 seconds for faster detection

  // Initial check
  isOnline().then((online) => {
    wasOnline = online;
    if (__DEV__) {
      console.log(`[Network] Initial state: ${online ? 'ONLINE' : 'OFFLINE'}`);
    }
    callback(online);
  });

  // Return unsubscribe function
  return () => {
    isSubscribed = false;
    clearInterval(interval);
  };
}
