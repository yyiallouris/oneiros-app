import {
  buildChatFollowupRequest,
  REFLECTIVE_DIALOGUE_PROMPT_ID,
  REFLECTIVE_DIALOGUE_QUESTION_CONTEXT_TAG,
} from '../src/ai/dreamReflectionPrompt';

const dream = {
  title: 'Το χέρι στην παραλία',
  date: '2026-08-27',
  content:
    'Στην παραλία πήγα να πιάσω το χέρι ενός παιδιού. Το σώμα του ήταν διάφανο, αλλά στεκόταν πολύ κοντά μου.',
};

const opening = {
  role: 'assistant' as const,
  content:
    'Η εγγύτητα του παιδιού δεν αναιρεί τη διαφάνειά του· η επαφή μένει δυνατή αλλά αβέβαιη.',
  reflectiveQuestion: {
    status: 'question',
    question: 'Όταν πήγες να πιάσεις το χέρι του, τι συνέβη στο άγγιγμα;',
    languageCode: 'el',
  },
};

const trajectories = [
  {
    id: 'sensory_answer',
    user: 'Το χέρι του ήταν ζεστό, αλλά περνούσε μέσα από το δικό μου.',
  },
  {
    id: 'correction',
    user: 'Δεν υπήρχε αβεβαιότητα. Ένιωθα απόλυτα ήρεμος μαζί του.',
  },
  {
    id: 'not_knowing',
    user: 'Δεν ξέρω. Δεν θυμάμαι να ένιωσα κάτι ιδιαίτερο.',
  },
  {
    id: 'waking_association',
    user: 'Μου θυμίζει τον γιο μου όταν ήταν μικρός, αλλά χωρίς τη λύπη που περίμενα.',
  },
  {
    id: 'meaning_request',
    user: 'Τι μπορεί να σημαίνει ότι ήταν διάφανο αλλά ζεστό;',
  },
  {
    id: 'brief_answer',
    user: 'Έμεινα εκεί.',
  },
] as const;

describe('Oneiros follow-up chat trajectory contract', () => {
  it.each(trajectories)(
    'keeps conversation history and the latest user material connected for $id',
    ({ user }) => {
      const answerRequest = buildChatFollowupRequest({
        dream,
        conversation: [opening],
        userMessage: user,
        isFinalResponse: false,
      });
      const joinedAnswerPrompt = answerRequest.messages
        .map((message) => message.content)
        .join('\n');

      expect(REFLECTIVE_DIALOGUE_PROMPT_ID).toBe('oneiros-followup-chat-v2.0.1');
      expect(answerRequest.responseFormat).toBeUndefined();
      expect(joinedAnswerPrompt).toContain('Continue the conversation naturally');
      expect(joinedAnswerPrompt).toContain(opening.content);
      expect(joinedAnswerPrompt).toContain(user);
      expect(joinedAnswerPrompt).toContain('If the user answers unexpectedly, follow that new material');
      expect(joinedAnswerPrompt).not.toContain(REFLECTIVE_DIALOGUE_QUESTION_CONTEXT_TAG);
      expect(answerRequest.messages.at(-1)).toEqual({ role: 'user', content: user });
    }
  );

  it('keeps the final reply conclusive and question-free', () => {
    const request = buildChatFollowupRequest({
      dream,
      conversation: [opening],
      userMessage: 'Νομίζω ότι θέλω να το αφήσω εδώ.',
      isFinalResponse: true,
    });
    const prompt = request.messages.map((message) => message.content).join('\n');

    expect(prompt).toContain('This is the final allowed assistant reply');
    expect(prompt).toContain('Ask no question');
  });
});
