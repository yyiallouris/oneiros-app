export type PersistedFollowupMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  reflectiveQuestions?: string[];
  [key: string]: unknown;
};

export type CommittedFollowupReplay = {
  interpretationId: string;
  assistantReply: string;
  messages: PersistedFollowupMessage[];
};

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Reconstructs a committed idempotent follow-up response from persisted chat
 * messages plus compact quota-result ids. It never calls the model or mutates
 * quota/persistence state.
 */
export function reconstructCommittedFollowupReplay(params: {
  interpretationId: string;
  requestMessage: string;
  messages: PersistedFollowupMessage[];
  quotaResult?: Record<string, unknown> | null;
}): CommittedFollowupReplay | null {
  const quotaInterpretationId = stringField(params.quotaResult?.interpretation_id);
  if (quotaInterpretationId && quotaInterpretationId !== params.interpretationId) return null;

  const userMessageId = stringField(params.quotaResult?.chat_followup_user_message_id);
  const assistantMessageId = stringField(params.quotaResult?.chat_followup_assistant_message_id);
  let assistantIndex = -1;

  if (userMessageId && assistantMessageId) {
    const userIndex = params.messages.findIndex((message) => message.id === userMessageId);
    assistantIndex = params.messages.findIndex((message) => message.id === assistantMessageId);
    if (
      userIndex < 0 ||
      assistantIndex !== userIndex + 1 ||
      params.messages[userIndex]?.role !== 'user' ||
      params.messages[assistantIndex]?.role !== 'assistant'
    ) {
      return null;
    }
  } else {
    const expectedMessage = params.requestMessage.trim();
    for (let index = params.messages.length - 2; index >= 0; index -= 1) {
      const user = params.messages[index];
      const assistant = params.messages[index + 1];
      if (
        user.role === 'user' &&
        user.content.trim() === expectedMessage &&
        assistant.role === 'assistant'
      ) {
        assistantIndex = index + 1;
        break;
      }
    }
  }

  const assistant = params.messages[assistantIndex];
  if (!assistant || assistant.role !== 'assistant' || !assistant.content.trim()) return null;
  return {
    interpretationId: quotaInterpretationId ?? params.interpretationId,
    assistantReply: assistant.content,
    messages: params.messages,
  };
}
