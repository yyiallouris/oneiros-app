/**
 * Flow coverage: flows-06 + flows-10.
 * A committed idempotent follow-up replay reconstructs the persisted response
 * and never starts another model/quota job.
 */
import { executeQuotaJob } from '../../src/billing/runtime';
import type { QuotaReservation } from '../../src/billing/types';
import {
  reconstructCommittedFollowupReplay,
  type PersistedFollowupMessage,
} from '../../supabase/functions/_shared/followup-replay';

describe('dream follow-up committed replay', () => {
  it('returns the persisted first reply on replay without a second generation or commit', async () => {
    const messages: PersistedFollowupMessage[] = [
      {
        id: 'opening',
        role: 'assistant',
        content: 'The bridge holds both banks in view.',
        timestamp: '2026-08-29T10:00:00.000Z',
      },
      {
        id: 'user-turn-1',
        role: 'user',
        content: 'The orchard voice sounded like me.',
        timestamp: '2026-08-29T10:01:00.000Z',
      },
      {
        id: 'assistant-turn-1',
        role: 'assistant',
        content: 'That makes the orchard intimate rather than merely unknown.\n\nWhat changes when your own voice comes from the orchard?',
        timestamp: '2026-08-29T10:01:02.000Z',
        reflectiveQuestions: ['What changes when your own voice comes from the orchard?'],
      },
    ];
    const committedResult = {
      interpretation_id: 'interpretation-text-id',
      chat_followup_user_message_id: 'user-turn-1',
      chat_followup_assistant_message_id: 'assistant-turn-1',
    };
    let replay = false;
    const generation = jest.fn(async () => ({
      value: { assistant_reply: messages[2].content },
      result: committedResult,
    }));
    const commit = jest.fn(async () => {
      replay = true;
    });
    const release = jest.fn(async () => undefined);
    const reserve = jest.fn(async (): Promise<QuotaReservation> =>
      replay
        ? { status: 'committed', quotaEventId: 'quota-1', result: committedResult }
        : { status: 'pending', quotaEventId: 'quota-1' }
    );

    const first = await executeQuotaJob({ reserve, commit, release, work: generation });
    expect(first.value).toEqual({ assistant_reply: messages[2].content });

    const repeated = await executeQuotaJob({ reserve, commit, release, work: generation });
    expect(repeated.value).toBeUndefined();
    const reconstructed = reconstructCommittedFollowupReplay({
      interpretationId: 'interpretation-text-id',
      requestMessage: 'The orchard voice sounded like me.',
      messages,
      quotaResult: repeated.reservation.result,
    });

    expect(reconstructed).toEqual({
      interpretationId: 'interpretation-text-id',
      assistantReply: messages[2].content,
      messages,
    });
    expect(generation).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(release).not.toHaveBeenCalled();
    expect(reserve).toHaveBeenCalledTimes(2);
  });

  it('supports legacy committed results without message ids and fails safely when absent', () => {
    const messages: PersistedFollowupMessage[] = [
      { id: 'u', role: 'user', content: 'Same message', timestamp: '2026-08-29T10:00:00Z' },
      { id: 'a', role: 'assistant', content: 'Persisted reply', timestamp: '2026-08-29T10:00:01Z' },
    ];
    expect(reconstructCommittedFollowupReplay({
      interpretationId: 'legacy-interpretation',
      requestMessage: 'Same message',
      messages,
      quotaResult: { interpretation_id: 'legacy-interpretation' },
    })?.assistantReply).toBe('Persisted reply');
    expect(reconstructCommittedFollowupReplay({
      interpretationId: 'legacy-interpretation',
      requestMessage: 'Missing message',
      messages,
      quotaResult: { interpretation_id: 'legacy-interpretation' },
    })).toBeNull();
  });
});
