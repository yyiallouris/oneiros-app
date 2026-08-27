import AsyncStorage from '@react-native-async-storage/async-storage';

const mockGetCurrentUserId = jest.fn();

jest.mock('../src/services/userService', () => ({
  UserService: {
    getCurrentUserId: (...args: unknown[]) => mockGetCurrentUserId(...args),
  },
}));

jest.mock('../src/services/logger', () => ({
  logError: jest.fn(),
}));

import { LocalStorage } from '../src/services/localStorage';
import { VoiceComposerService } from '../src/services/voiceComposerService';

const target = { surface: 'write' as const, key: 'active' };

describe('VoiceComposerService concurrency', () => {
  beforeEach(async () => {
    VoiceComposerService.resetRuntimeForTests();
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('serializes a typed save before its first await so it cannot enter after transcript commit', async () => {
    let resolveSession!: (userId: string) => void;
    mockGetCurrentUserId.mockImplementationOnce(() => new Promise<string>((resolve) => {
      resolveSession = resolve;
    })).mockResolvedValue('user-1');

    const typedSave = VoiceComposerService.saveText(target, 'typed while recording');
    const transcriptCommit = VoiceComposerService.commitTranscriptForUser(
      'user-1',
      target,
      { id: 'voice-serialized', transcript: 'the actual spoken ending' },
      'typed while recording',
    );
    await Promise.resolve();
    resolveSession('user-1');

    await typedSave;
    await expect(transcriptCommit).resolves.toEqual(expect.objectContaining({
      text: 'typed while recording\nthe actual spoken ending',
      deliveredClipIds: ['voice-serialized'],
      revision: 2,
    }));
    await expect(LocalStorage.getVoiceComposer('user-1', target)).resolves.toEqual(
      expect.objectContaining({
        text: 'typed while recording\nthe actual spoken ending',
        deliveredClipIds: ['voice-serialized'],
      }),
    );
  });

  it('never rebinds A queued text to B or writes after owner cleanup', async () => {
    let activeOwner = 'user-a';
    mockGetCurrentUserId.mockImplementation(async () => activeOwner);

    const accountSwitchSave = VoiceComposerService.saveText(target, 'private text from A');
    activeOwner = 'user-b';
    await accountSwitchSave;

    await expect(LocalStorage.getVoiceComposer('user-b', target)).resolves.toBeNull();
    await expect(LocalStorage.getVoiceComposer('user-a', target)).resolves.toBeNull();

    VoiceComposerService.resetRuntimeForTests();
    await AsyncStorage.clear();
    let resolveCapturedOwner!: (owner: string) => void;
    mockGetCurrentUserId.mockReset();
    mockGetCurrentUserId.mockImplementationOnce(() => new Promise<string>((resolve) => {
      resolveCapturedOwner = resolve;
    }));
    const delayedSave = VoiceComposerService.saveText(target, 'must not return after logout');
    const cleanup = VoiceComposerService.runOwnerCleanup(() => AsyncStorage.clear());

    await cleanup;
    resolveCapturedOwner('user-a');
    await delayedSave;

    await expect(LocalStorage.getVoiceComposer('user-a', target)).resolves.toBeNull();
  });
});
