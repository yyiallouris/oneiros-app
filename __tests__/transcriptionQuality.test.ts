import { assessTranscriptQuality } from '../src/utils/transcriptionQuality';

describe('transcription quality commit gate', () => {
  it.each([
    'Υπότιτλοι AUTHORWAVE',
    'ΥΠΟΤΙΤΛΟΙ authorwave.',
    'Subtitles by Amara.org',
    'Captions provided by Amara org',
    'Thank you for watching.',
    'Please like and subscribe.',
    'Ευχαριστώ που παρακολουθήσατε.',
  ])('rejects known caption-data hallucinations: %s', (text) => {
    expect(assessTranscriptQuality({ text, durationMs: 180_000 })).toEqual({
      accepted: false,
      issue: 'known_caption_hallucination',
    });
  });

  it('rejects a tiny transcript for a long recording', () => {
    expect(assessTranscriptQuality({ text: 'A red door.', durationMs: 180_000 })).toEqual({
      accepted: false,
      issue: 'implausibly_short',
    });
  });

  it('rejects repetition loops', () => {
    expect(assessTranscriptQuality({
      text: 'Thank you thank you thank you thank you thank you thank you thank you thank you thank you thank you.',
      durationMs: 30_000,
    })).toEqual({ accepted: false, issue: 'repetition_loop' });
  });

  it('rejects a repeated multi-word decoder loop', () => {
    expect(assessTranscriptQuality({
      text: 'The red door opens the red door opens the red door opens the red door opens.',
      durationMs: 30_000,
    })).toEqual({ accepted: false, issue: 'repetition_loop' });
  });

  it('accepts a normal Greek dream narration', () => {
    expect(assessTranscriptQuality({
      text: 'Ήμουν σε ένα παλιό σπίτι και άνοιξα μια κόκκινη πόρτα. Πίσω της υπήρχε θάλασσα και ένιωθα ήρεμος.',
      durationMs: 35_000,
    })).toEqual({ accepted: true });
  });

  it('does not block a longer legitimate discussion that mentions the signature', () => {
    expect(assessTranscriptQuality({
      text: 'Μιλούσα για αρκετή ώρα και μετά η εφαρμογή έγραψε Υπότιτλοι AUTHORWAVE αντί για όσα είχα πει, οπότε θέλω να καταλάβω τι συνέβη.',
      durationMs: 25_000,
    })).toEqual({ accepted: true });
  });
});
