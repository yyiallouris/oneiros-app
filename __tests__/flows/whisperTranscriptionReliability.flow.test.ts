import fs from 'fs';
import path from 'path';

const functionSource = fs.readFileSync(
  path.join(__dirname, '../../supabase/functions/whisper-transcription/index.ts'),
  'utf8',
);
const reservationMigration = fs.readFileSync(
  path.join(__dirname, '../../supabase/migrations/20260826120000_fence_voice_transcription_leases.sql'),
  'utf8',
);
const voiceRecordingSource = fs.readFileSync(
  path.join(__dirname, '../../src/utils/voiceRecording.ts'),
  'utf8',
);
const voiceQueueSource = fs.readFileSync(
  path.join(__dirname, '../../src/services/voiceTranscriptionQueueService.ts'),
  'utf8',
);
const voiceButtonSource = fs.readFileSync(
  path.join(__dirname, '../../src/components/ui/VoiceRecordButton.tsx'),
  'utf8',
);
const localStorageSource = fs.readFileSync(
  path.join(__dirname, '../../src/services/localStorage.ts'),
  'utf8',
);
const composerServiceSource = fs.readFileSync(
  path.join(__dirname, '../../src/services/voiceComposerService.ts'),
  'utf8',
);
const writeScreenSource = fs.readFileSync(
  path.join(__dirname, '../../src/screens/WriteScreen.tsx'),
  'utf8',
);
const dreamDetailSource = fs.readFileSync(
  path.join(__dirname, '../../src/screens/DreamDetailScreen.tsx'),
  'utf8',
);
const interpretationChatSource = fs.readFileSync(
  path.join(__dirname, '../../src/screens/InterpretationChatScreen.tsx'),
  'utf8',
);
const appConfig = fs.readFileSync(path.join(__dirname, '../../app.config.js'), 'utf8');
const storagePrivacyPlugin = fs.readFileSync(
  path.join(__dirname, '../../plugins/withVoicePendingStoragePrivacy.js'),
  'utf8',
);

describe('whisper transcription reliability boundary', () => {
  it('authenticates before parsing audio and reserves only after validating the file', () => {
    const authIndex = functionSource.indexOf('await supabase.auth.getUser()');
    const formIndex = functionSource.indexOf('await req.formData()');
    const sizeIndex = functionSource.indexOf('file.size > MAX_AUDIO_BYTES');
    const reserveIndex = functionSource.indexOf(".rpc('reserve_voice_transcription'");

    expect(authIndex).toBeGreaterThan(-1);
    expect(formIndex).toBeGreaterThan(authIndex);
    expect(sizeIndex).toBeGreaterThan(formIndex);
    expect(reserveIndex).toBeGreaterThan(sizeIndex);
  });

  it('releases failed reservations and persists successful transcripts', () => {
    expect(functionSource).toContain('await releaseReservation()');
    expect(functionSource).toContain("status: 'completed'");
    expect(functionSource).toContain(".eq('lease_id', leaseId)");
    expect(functionSource).toContain("code: 'TRANSCRIPTION_IN_PROGRESS'");
  });

  it('uses an atomic, fenced service-role reservation with stale-lock recovery', () => {
    expect(reservationMigration).toContain('for update');
    expect(reservationMigration).toContain("now() - interval '4 minutes'");
    expect(reservationMigration).toContain('reservation_lease_id uuid');
    expect(reservationMigration).toContain('lease_id = v_lease_id');
    expect(reservationMigration).toContain('grant execute');
    expect(reservationMigration).toContain('to service_role');
  });

  it('uses the recommended transcription model and rejects hallucinations before commit', () => {
    expect(functionSource).toContain("const TRANSCRIPTION_MODEL = 'gpt-transcribe'");
    expect(functionSource).toContain('assessTranscriptQuality');
    expect(functionSource).toContain("code: 'LOW_CONFIDENCE_TRANSCRIPT'");
    expect(functionSource).toContain('qualityRecoveryUsed');
    expect(functionSource).toContain('rejected and evicted cached transcript');
    expect(functionSource).not.toContain("model === 'whisper-1'");
  });

  it('keeps the server in control of model and prompt context', () => {
    expect(functionSource).not.toContain("formData.get('model')");
    expect(functionSource).not.toContain("formData.get('prompt')");
    expect(functionSource).not.toContain("openaiFormData.append('prompt'");
    expect(functionSource).toContain("openaiFormData.append('languages[]', language)");
    expect(functionSource).toContain('voice-transcription-v3.0.0-language-neutral');
  });

  it('requires a valid idempotency key instead of silently creating one', () => {
    expect(functionSource).toContain("code: 'INVALID_IDEMPOTENCY_KEY'");
    expect(functionSource).toContain('if (!idempotencyKey)');
    expect(functionSource).not.toContain('supplied\n    ? supplied\n    : crypto.randomUUID()');
  });

  it('enforces atomic rolling rate and concurrency ceilings before provider work', () => {
    expect(reservationMigration).toContain('pg_advisory_xact_lock');
    expect(reservationMigration).toContain('voice_transcription_attempts');
    expect(reservationMigration).toContain("interval '1 hour'");
    expect(reservationMigration).toContain("interval '24 hours'");
    expect(reservationMigration).toContain("'concurrency'::text");
    expect(functionSource).toContain("reservation.request_status === 'rate_limited'");
    expect(reservationMigration).toContain('voice_transcription_attempts_created_idx');
    expect(reservationMigration).toContain('on public.voice_transcription_attempts (created_at)');
  });

  it('keeps pending raw audio in a dedicated directory excluded from platform backups', () => {
    expect(voiceRecordingSource).toContain("VOICE_PENDING_DIRECTORY_NAME = 'voice_pending'");
    expect(voiceRecordingSource).toContain('ensureVoicePendingDirectory()');
    expect(storagePrivacyPlugin).toContain("'android:fullBackupContent'");
    expect(storagePrivacyPlugin).toContain("'@xml/oneiros_backup_rules'");
    expect(storagePrivacyPlugin).toContain("'android:dataExtractionRules'");
    expect(storagePrivacyPlugin.match(/<exclude domain="file" path="voice_pending\/" \/>/g))
      .toHaveLength(3);
    expect(storagePrivacyPlugin).not.toContain('<include domain=');
    expect(storagePrivacyPlugin).toContain('<cloud-backup>');
    expect(storagePrivacyPlugin).toContain('<device-transfer>');
    expect(storagePrivacyPlugin).toContain('resourceValues.isExcludedFromBackup = true');
    expect(storagePrivacyPlugin).toContain('appendingPathComponent("voice_pending"');
    expect(storagePrivacyPlugin).toContain('legacyVoicePattern');
    expect(storagePrivacyPlugin).toContain('legacyResourceValues.isExcludedFromBackup = true');
    expect(appConfig).toContain("'./plugins/withVoicePendingStoragePrivacy'");
    expect(voiceRecordingSource).toContain('migrateLegacyPendingClipUri');
    expect(voiceRecordingSource).toContain('audioFilesEquivalent(sourceInfo, destinationInfo)');
    expect(voiceRecordingSource).toContain('legacy_repair_verification_failed');
    expect(voiceRecordingSource).toContain('voice_recording_legacy_destination_replaced');
    expect(voiceQueueSource).toContain('voice_transcription_legacy_queue_migrated');
  });

  it('fences async recorder start and refuses incomplete owner cleanup', () => {
    expect(voiceRecordingSource).toContain('recordingLifecycleGeneration');
    expect(voiceRecordingSource).toContain('startWasCancelled()');
    expect(voiceRecordingSource).toContain('discardPendingClipStrict');
    expect(voiceRecordingSource).toContain('voice_clip_delete_not_confirmed');
    expect(voiceQueueSource).toContain('VOICE_OWNER_CLEANUP_INCOMPLETE');
    expect(voiceQueueSource).toContain("new VoiceOwnerCleanupIncompleteError('metadata_unreadable')");
    expect(voiceQueueSource).toContain("new VoiceOwnerCleanupIncompleteError('audio_delete_failed')");
  });

  it('shows a durable transcript before independent cleanup and schedules lease conflicts durably', () => {
    expect(voiceQueueSource).toContain('async peekCompleted');
    expect(voiceQueueSource).toContain('VoiceComposerService.commitTranscriptForUser');
    const visibleApplyIndex = voiceButtonSource.indexOf('completionCallbackRef.current(committed.text)');
    const cleanupIndex = voiceButtonSource.indexOf('voiceTranscriptionQueueService.acknowledge(transcript.id)');
    expect(visibleApplyIndex).toBeGreaterThan(-1);
    expect(visibleApplyIndex).toBeLessThan(cleanupIndex);
    expect(voiceQueueSource).toContain('acknowledgeComposerIntegration');
    expect(voiceQueueSource).toContain("status: 'deletion_pending'");
    expect(functionSource).toContain("select('status, transcript, updated_at')");
    expect(functionSource).toContain("{ 'Retry-After': String(retryAfterSeconds) }");
    expect(voiceRecordingSource).toContain("code === 'transcription_in_progress'");
  });

  it('binds composer commands at creation and guards every hydration surface from stale reads', () => {
    expect(composerServiceSource).toContain('runComposerCommand');
    const saveCommand = composerServiceSource.slice(
      composerServiceSource.indexOf('static async saveText'),
      composerServiceSource.indexOf('static async clear'),
    );
    expect(saveCommand.indexOf('captureOwnerCommand()'))
      .toBeLessThan(saveCommand.indexOf('runComposerCommand(target'));
    expect(saveCommand.indexOf('baseRevisionAtCreation'))
      .toBeLessThan(saveCommand.indexOf('runComposerCommand(target'));
    expect(composerServiceSource).toContain('static async runOwnerCleanup');
    expect(composerServiceSource).toContain('previousLifecycle.cancel()');
    expect(localStorageSource).toContain('acknowledgeVoiceComposerDeliveries');
    expect(localStorageSource).not.toContain('text.includes(delivery.transcript)');
    for (const screenSource of [writeScreenSource, dreamDetailSource, interpretationChatSource]) {
      expect(screenSource).toContain('new EditRevisionGuard()');
      expect(screenSource).toContain('.capture()');
      expect(screenSource).toContain('.isCurrent(hydrationRevision)');
      expect(screenSource).toContain('.markEdited()');
    }
  });

  it('describes temperature zero as a recovery hint rather than determinism', () => {
    expect(functionSource).toContain('lowTemperatureRecovery?: boolean');
    expect(functionSource).not.toContain('deterministic?: boolean');
  });
});
