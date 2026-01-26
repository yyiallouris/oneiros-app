# Storage Architecture

This document describes the clean, offline-first storage architecture for the app.

## Architecture Overview

The storage system is divided into **4 clean layers** with clear responsibilities:

```
┌─────────────────────────────────────┐
│   StorageService (Main Interface)   │  ← Screens use this
├─────────────────────────────────────┤
│   UserService  │  SyncService       │  ← Business logic
├─────────────────────────────────────┤
│   LocalStorage │  RemoteStorage     │  ← Data access
└─────────────────────────────────────┘
```

## Layer Responsibilities

### 1. **StorageService** (`src/services/storageService.ts`)
**Main interface for all screens**

- ✅ Handles user isolation (clears data when user changes)
- ✅ Offline-first operations (always saves locally first)
- ✅ Background syncing (non-blocking)
- ✅ Automatic merge of remote data when online

**Usage:**
```typescript
import { StorageService } from '../services/storageService';

// Save dream (works offline)
await StorageService.saveDream(dream);

// Get dreams (returns local immediately, syncs in background)
const dreams = await StorageService.getDreams();
```

### 2. **UserService** (`src/services/userService.ts`)
**User authentication and isolation**

- ✅ Get current user ID (from cached session, works offline)
- ✅ Detect user changes
- ✅ Clear data when user logs out or changes

**Key Features:**
- Uses `getSession()` (reads from AsyncStorage) - **works offline**
- Detects when a different user logs in on the same device
- Automatically clears previous user's data

### 3. **LocalStorage** (`src/services/localStorage.ts`)
**Pure local storage operations**

- ✅ Read/write to AsyncStorage only
- ✅ No user checks, no network calls, no business logic
- ✅ Works completely offline
- ✅ Fast and reliable

**Operations:**
- Dreams: `getDreams()`, `saveDream()`, `deleteDream()`, etc.
- Interpretations: `getInterpretations()`, `saveInterpretation()`, etc.
- Unsynced queue: `getUnsyncedDreams()`, `addUnsyncedDream()`, etc.

### 4. **SyncService** (`src/services/syncService.ts`)
**Synchronization between local and remote**

- ✅ Syncs unsynced dreams/interpretations to remote when online
- ✅ Fetches remote data and merges with local when online
- ✅ All operations are non-blocking and happen in background

**Key Features:**
- Only syncs when user is authenticated AND online
- Merges remote + local (remote takes precedence)
- Handles sync failures gracefully

## Data Flow

### Saving a Dream (Offline)

```
User clicks "Save"
    ↓
StorageService.saveDream()
    ↓
LocalStorage.saveDream()  ← Saves to AsyncStorage (instant, works offline)
    ↓
LocalStorage.addUnsyncedDream()  ← Adds to sync queue
    ↓
SyncService.syncUnsyncedDreams()  ← Runs in background (non-blocking)
    ↓
[If online] remoteSaveDream()  ← Syncs to database
```

### Loading Dreams (Offline)

```
User opens Journal
    ↓
StorageService.getDreams()
    ↓
LocalStorage.getDreams()  ← Returns local dreams immediately
    ↓
[Background] SyncService.fetchAndMergeDreams()  ← Fetches remote if online
```

### User Change Detection

```
App starts / User logs in
    ↓
StorageService.initialize()
    ↓
UserService.hasUserChanged()
    ↓
[If user changed]
    ↓
LocalStorage.clearAll()  ← Clears all local data
    ↓
UserService.storeUserId()  ← Stores new user ID
```

## User Isolation

### How It Works

1. **On App Start:**
   - `StorageService.initialize()` checks if user changed
   - If different user → clears all local data
   - Prevents User A's data from showing to User B

2. **On Logout:**
   - `StorageService.clearAll()` clears all local storage
   - Removes user ID from storage

3. **On Login:**
   - `StorageService.initialize()` runs again
   - If user changed → clears old user's data
   - Stores new user ID

### Storage Keys

- `@dreams` - All dreams (local cache)
- `@interpretations` - All interpretations (local cache)
- `@unsynced_dreams` - Dreams waiting to sync
- `@unsynced_interpretations` - Interpretations waiting to sync
- `@current_user_id` - Current logged-in user ID

## Offline-First Strategy

### Principles

1. **Always save locally first** - Works offline, instant response
2. **Queue for sync** - Add to unsynced queue for background sync
3. **Return local immediately** - Don't wait for network calls
4. **Sync in background** - Non-blocking, doesn't affect UI

### Benefits

- ✅ Works completely offline
- ✅ Fast, responsive UI
- ✅ Automatic sync when back online
- ✅ No data loss
- ✅ User isolation (prevents cross-user contamination)

## Migration from Old Code

The old `src/utils/storage.ts` is now a **backward compatibility wrapper** that uses the new services. Existing code continues to work without changes.

**New code should use:**
```typescript
import { StorageService } from '../services/storageService';
```

**Old code still works:**
```typescript
import { saveDream, getDreams } from '../utils/storage';
```

## Best Practices

1. **Always use StorageService** for new code
2. **Don't call LocalStorage directly** from screens (use StorageService)
3. **Don't call SyncService directly** from screens (StorageService handles it)
4. **Initialize on app start** - RootNavigator calls `StorageService.initialize()`

## Testing

See `OFFLINE_TESTING.md` for testing offline functionality.

## File Structure

```
src/
├── services/
│   ├── storageService.ts      ← Main interface (use this!)
│   ├── userService.ts          ← User management
│   ├── localStorage.ts         ← Pure local operations
│   ├── syncService.ts          ← Background syncing
│   └── remoteStorage.ts        ← Remote API calls
└── utils/
    └── storage.ts              ← Backward compatibility wrapper
```
