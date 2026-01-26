# Testing Offline Functionality

This guide explains how to test the offline save functionality in the app.

## Quick Test Methods

### Method 1: Airplane Mode (Recommended - Easiest)
1. **On Physical Device:**
   - Enable Airplane Mode in device settings
   - Open Expo Go app
   - Save a dream
   - Navigate to Journal - dream should appear
   - Navigate to DreamDetail - dream should load
   - Disable Airplane Mode
   - Wait a few seconds - dream should sync to database

### Method 2: Disable Wi-Fi/Data
1. **On Physical Device:**
   - Turn off Wi-Fi
   - Turn off Mobile Data
   - Test saving dreams
   - Re-enable network to test sync

### Method 3: iOS Simulator
1. Open iOS Simulator
2. Go to: **Device → Network Link Conditioner**
3. Select: **100% Loss** or **Very Bad Network**
4. Test the app
5. Disable to test sync

### Method 4: Android Emulator
1. Open Android Emulator
2. Go to: **Settings → Network & Internet**
3. Turn off Wi-Fi
4. Or use ADB:
   ```bash
   adb shell svc wifi disable
   adb shell svc data disable
   ```
5. To re-enable:
   ```bash
   adb shell svc wifi enable
   adb shell svc data enable
   ```

## Testing with Force Offline Mode (Development Only) ⭐ RECOMMENDED

**This is the easiest way to test offline functionality while keeping logs connected!**

We've added a **Developer Toggle Button** that appears in the top-right corner of the app (only in development mode).

### How to Use:

1. **Look for the floating button** in the top-right corner:
   - 📶 Green button = Currently ONLINE
   - 📴 Red button = Currently FORCED OFFLINE

2. **Tap the button** to toggle between online and forced offline mode

3. **Watch the logs** - You'll see clear messages like:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🧪 DEV MODE: Force offline ENABLED
      Actual network: ONLINE
      App will behave as: OFFLINE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

4. **Test your offline flow:**
   - Tap to force offline (button turns red)
   - Save a dream - should work offline
   - Check logs - you'll see all the sync messages
   - Tap again to go back online
   - Watch the sync happen in real-time!

### Benefits:
- ✅ **Keep logs connected** - No need to disconnect from network
- ✅ **Instant toggle** - Switch between online/offline instantly
- ✅ **See actual vs forced state** - Button shows both states
- ✅ **Works everywhere** - Available on all screens

### Programmatic Usage (Advanced):

If you need to toggle programmatically:
```typescript
import { setForceOfflineMode } from './src/utils/network';

// Force offline mode
setForceOfflineMode(true);

// Restore normal network detection
setForceOfflineMode(false);
```

⚠️ **Important:** The toggle button only appears in development mode (`__DEV__`). It's automatically hidden in production builds.

## What to Test

### ✅ Offline Save Flow:
1. Go offline (airplane mode or force offline)
2. Write a dream
3. Click "Save dream"
4. Should navigate to DreamDetail immediately
5. Dream should be visible
6. Navigate to Journal tab
7. Dream should appear in the list

### ✅ Sync When Back Online:
1. Save dream while offline
2. Go back online
3. Wait a few seconds (background sync runs)
4. Check Supabase database - dream should be there
5. Close and reopen app
6. Dream should still be there (loaded from remote)

### ✅ Multiple Dreams Offline:
1. Go offline
2. Save multiple dreams
3. All should appear in Journal
4. Go online
5. All should sync to database

### ✅ User Change Protection:
1. Save dreams as User A (offline)
2. Log out
3. Log in as User B
4. User B should NOT see User A's dreams
5. User B's local storage should be cleared

## Debugging

### Check Logs:
The app logs network state changes. Look for:
- `[Network] Force offline mode: true/false`
- `dream_save_local` - dream saved locally
- `dream_save_offline` - saved while offline
- `sync_skipped_offline` - sync skipped because offline
- `sync_started` - sync started when back online
- `dream_synced` - dream successfully synced

### Check AsyncStorage:
You can inspect AsyncStorage to see:
- `@dreams` - all saved dreams (local)
- `@unsynced_dreams` - dreams waiting to sync
- `@current_user_id` - current logged-in user

### Check Supabase:
After going back online, check your Supabase dashboard:
- `dreams` table should have the synced dreams
- `user_id` should match the logged-in user

## Common Issues

### Issue: Dream doesn't appear after saving offline
**Solution:** Check that `saveDream()` is saving to AsyncStorage. The dream should appear immediately in local storage.

### Issue: Dream doesn't sync when back online
**Solution:** 
- Check network state detection
- Check if `syncUnsyncedDreams()` is being called
- Check logs for sync errors
- Verify user is authenticated

### Issue: Dreams from different users appear
**Solution:** 
- Check `checkUserChanged()` function
- Verify `clearLocalStorage()` is called on logout
- Check `CURRENT_USER_ID_KEY` in AsyncStorage

## Notes

- **expo-network** is required for accurate network detection
- Network state is cached for 5 seconds to reduce API calls
- Background sync runs automatically when network comes back online
- Sync is non-blocking - won't block the UI
