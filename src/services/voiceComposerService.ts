import {
  CompletedVoiceTranscript,
  VoiceComposerState,
  VoiceTranscriptionTarget,
} from '../types/dream';
import { LocalStorage } from './localStorage';
import { logError } from './logger';
import { UserService } from './userService';

/** Lightweight owner-scoped composer persistence; intentionally has no native audio dependency. */
const composerChains = new Map<string, Promise<void>>();
const observedTargetRevisions = new Map<string, number>();

type ComposerLifecycle = {
  generation: number;
  cancelled: Promise<void>;
  cancel: () => void;
};

function createLifecycle(generation: number): ComposerLifecycle {
  let cancel!: () => void;
  const cancelled = new Promise<void>((resolve) => { cancel = resolve; });
  return { generation, cancelled, cancel };
}

let lifecycle = createLifecycle(0);
let cleanupBarrier: Promise<void> = Promise.resolve();
let cleanupChain: Promise<void> = Promise.resolve();

function targetKey(target: VoiceTranscriptionTarget): string {
  return `${target.surface}:${target.key}`;
}

function runComposerCommand<T>(target: VoiceTranscriptionTarget, command: () => Promise<T>): Promise<T> {
  const key = targetKey(target);
  const previous = composerChains.get(key) ?? Promise.resolve();
  const run = previous.then(command, command);
  const settled = run.then(() => undefined, () => undefined);
  composerChains.set(key, settled);
  void settled.finally(() => {
    if (composerChains.get(key) === settled) composerChains.delete(key);
  });
  return run;
}

type CapturedOwner = { userId: string } | { cancelled: true } | null;

function captureOwnerCommand() {
  // Start the auth read at command creation, before the command can wait behind
  // another target mutation. The same owner is revalidated immediately before
  // persistence so A's queued text can never be rebound to B.
  const capturedLifecycle = lifecycle;
  const ownerAtCreation = Promise.resolve(UserService.getCurrentUserId());
  const barrierAtCreation = cleanupBarrier;

  const resolveOwner = async (): Promise<CapturedOwner> => {
    const captured = await Promise.race([
      ownerAtCreation.then((userId) => ({ kind: 'owner' as const, userId })),
      capturedLifecycle.cancelled.then(() => ({ kind: 'cancelled' as const })),
    ]);
    if (captured.kind === 'cancelled') return { cancelled: true };
    await barrierAtCreation;
    if (capturedLifecycle !== lifecycle || captured.userId == null) return { cancelled: true };
    const activeUserId = await UserService.getCurrentUserId();
    if (capturedLifecycle !== lifecycle || activeUserId !== captured.userId) return null;
    return { userId: captured.userId };
  };

  return { resolveOwner };
}

export class VoiceComposerService {
  static async getSnapshot(target: VoiceTranscriptionTarget): Promise<VoiceComposerState | null> {
    const captured = captureOwnerCommand();
    try {
      return await runComposerCommand(target, async () => {
        const owner = await captured.resolveOwner();
        if (!owner || 'cancelled' in owner) return null;
        const snapshot = await LocalStorage.getVoiceComposer(owner.userId, target);
        if (snapshot?.revision != null) {
          observedTargetRevisions.set(targetKey(target), snapshot.revision);
        }
        return snapshot;
      });
    } catch (error) {
      // Hydration is recovery-only and must never destabilize the live input.
      // Strict transcript commits still propagate integrity failures.
      logError('voice_composer_restore_failed', error);
      return null;
    }
  }

  static async getText(target: VoiceTranscriptionTarget): Promise<string | null> {
    return (await this.getSnapshot(target))?.text ?? null;
  }

  static async saveText(target: VoiceTranscriptionTarget, text: string): Promise<void> {
    const captured = captureOwnerCommand();
    // Capture the revision represented by the visible input now, not later
    // when this command eventually reaches the head of the target chain.
    const baseRevisionAtCreation = observedTargetRevisions.get(targetKey(target)) ?? 0;
    try {
      await runComposerCommand(target, async () => {
        const owner = await captured.resolveOwner();
        if (!owner || 'cancelled' in owner) return;
        const saved = await LocalStorage.saveVoiceComposerText(
          owner.userId,
          target,
          text,
          baseRevisionAtCreation,
        );
        const savedRevision = saved.revision ?? baseRevisionAtCreation;
        observedTargetRevisions.set(targetKey(target), savedRevision);
      });
    } catch (error) {
      // Typing must remain usable when optional crash-recovery persistence is
      // temporarily unavailable. Completed voice delivery does not use this
      // best-effort path and still fails closed before queue acknowledgement.
      logError('voice_composer_save_failed', error);
    }
  }

  static async clear(target: VoiceTranscriptionTarget): Promise<void> {
    const captured = captureOwnerCommand();
    await runComposerCommand(target, async () => {
      const owner = await captured.resolveOwner();
      if (!owner || 'cancelled' in owner) return;
      await LocalStorage.clearVoiceComposer(owner.userId, target);
      observedTargetRevisions.delete(targetKey(target));
    });
  }

  static async commitTranscriptForUser(
    userId: string,
    target: VoiceTranscriptionTarget,
    delivery: CompletedVoiceTranscript,
    currentText: string,
  ): Promise<VoiceComposerState> {
    const capturedLifecycle = lifecycle;
    const activeOwnerAtCreation = Promise.resolve(UserService.getCurrentUserId());
    const barrierAtCreation = cleanupBarrier;
    return runComposerCommand(target, async () => {
      const activeOwner = await Promise.race([
        activeOwnerAtCreation,
        capturedLifecycle.cancelled.then(() => null),
      ]);
      await barrierAtCreation;
      if (capturedLifecycle !== lifecycle || activeOwner !== userId) {
        throw new Error('Voice composer owner changed before transcript commit');
      }
      const currentOwner = await UserService.getCurrentUserId();
      if (capturedLifecycle !== lifecycle || currentOwner !== userId) {
        throw new Error('Voice composer owner changed before transcript commit');
      }
      const committed = await LocalStorage.commitVoiceTranscript(userId, target, delivery, currentText);
      const committedRevision = committed.revision ?? 0;
      observedTargetRevisions.set(targetKey(target), committedRevision);
      return committed;
    });
  }

  static async acknowledgeVisibleDeliveries(
    userId: string,
    target: VoiceTranscriptionTarget,
    deliveryIds: string[],
    visibleRevision: number,
  ): Promise<void> {
    const capturedLifecycle = lifecycle;
    const barrierAtCreation = cleanupBarrier;
    await runComposerCommand(target, async () => {
      await barrierAtCreation;
      const activeOwner = await UserService.getCurrentUserId();
      if (capturedLifecycle !== lifecycle || activeOwner !== userId) return;
      const acknowledged = await LocalStorage.acknowledgeVoiceComposerDeliveries(
        userId,
        target,
        deliveryIds,
        visibleRevision,
      );
      if (acknowledged?.revision != null) {
        observedTargetRevisions.set(targetKey(target), acknowledged.revision);
      }
    });
  }

  static async acknowledgeVisibleSnapshot(snapshot: VoiceComposerState): Promise<void> {
    const deliveryIds = (snapshot.pendingDeliveries ?? []).map((delivery) => delivery.id);
    if (deliveryIds.length === 0) return;
    try {
      await this.acknowledgeVisibleDeliveries(
        snapshot.userId,
        snapshot.target,
        deliveryIds,
        snapshot.revision ?? 0,
      );
    } catch (error) {
      // The durable delivery ledger intentionally remains for a later hydrate.
      logError('voice_composer_integration_ack_deferred', error);
    }
  }

  /**
   * Invalidates every command created by the previous auth owner, drains any
   * write already inside LocalStorage, and holds commands created during
   * cleanup behind a barrier until the caller's local cleanup is complete.
   */
  static async runOwnerCleanup<T>(cleanup: () => Promise<T>): Promise<T> {
    let result!: T;
    let failure: unknown;
    const run = cleanupChain.then(async () => {
      const previousLifecycle = lifecycle;
      lifecycle = createLifecycle(previousLifecycle.generation + 1);
      previousLifecycle.cancel();

      let releaseBarrier!: () => void;
      cleanupBarrier = new Promise<void>((resolve) => { releaseBarrier = resolve; });
      const commandsToDrain = [...composerChains.values()];
      try {
        await Promise.all(commandsToDrain);
        result = await cleanup();
        observedTargetRevisions.clear();
      } catch (error) {
        failure = error;
      } finally {
        releaseBarrier();
      }
    });
    cleanupChain = run.then(() => undefined, () => undefined);
    await run;
    if (failure !== undefined) throw failure;
    return result;
  }

  static resetRuntimeForTests(): void {
    if (process.env.NODE_ENV !== 'test') return;
    lifecycle.cancel();
    lifecycle = createLifecycle(0);
    cleanupBarrier = Promise.resolve();
    cleanupChain = Promise.resolve();
    composerChains.clear();
    observedTargetRevisions.clear();
  }
}
