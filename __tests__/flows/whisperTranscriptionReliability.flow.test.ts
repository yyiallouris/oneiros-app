import fs from 'fs';
import path from 'path';

const functionSource = fs.readFileSync(
  path.join(__dirname, '../../supabase/functions/whisper-transcription/index.ts'),
  'utf8',
);
const reservationMigration = fs.readFileSync(
  path.join(__dirname, '../../supabase/migrations/20260723143000_add_voice_transcription_reservation.sql'),
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
    expect(functionSource).toContain("status: 'completed', transcript: payload.text");
    expect(functionSource).toContain("code: 'TRANSCRIPTION_IN_PROGRESS'");
  });

  it('uses an atomic service-role reservation with stale-lock recovery', () => {
    expect(reservationMigration).toContain('for update');
    expect(reservationMigration).toContain("now() - interval '2 minutes'");
    expect(reservationMigration).toContain('grant execute');
    expect(reservationMigration).toContain('to service_role');
  });
});
