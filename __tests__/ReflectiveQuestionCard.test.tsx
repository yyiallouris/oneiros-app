import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { ReflectiveQuestionCard } from '../src/components/ui/ReflectiveQuestionCard';
import {
  createComposerQuestionArtifact,
  createEditorialArcQuestionArtifact,
  createReflectiveQuestionArtifact,
} from '../src/ai/reflectiveQuestionPrompt';
import {
  ONEIROS_LANGUAGE_CODES,
  type OneirosLanguageCode,
} from '../src/constants/oneirosLanguages';
import {
  CONTINUE_CONVERSATION_LABEL,
  REFLECTIVE_QUESTION_COPY,
  REFLECTIVE_QUESTION_UI_COPY,
} from '../src/constants/reflectiveQuestionCopy';

function questionArtifact(question: string, languageCode: OneirosLanguageCode = 'en') {
  return createReflectiveQuestionArtifact({
    id: 'rq-card-test',
    surface: 'initial',
    createdAt: '2026-08-27T12:00:00.000Z',
    question,
    languageCode,
    evidenceIds: ['D1'],
  });
}

describe('ReflectiveQuestionCard', () => {
  it('renders the English conversation opening and activates its CTA', () => {
    const onContinue = jest.fn();
    const view = render(
      <ReflectiveQuestionCard
        artifact={questionArtifact(
          'Where does the fox seem to be going while you remain beside the open gate?'
        )}
        onContinue={onContinue}
      />
    );

    expect(view.getByText('Reflective Questions')).toBeTruthy();
    expect(view.getByText(/Where does the fox seem to be going/)).toBeTruthy();
    fireEvent.press(view.getByLabelText(CONTINUE_CONVERSATION_LABEL));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('keeps Greek reflective content inside shared English app chrome', () => {
    const view = render(
      <ReflectiveQuestionCard
        artifact={questionArtifact(
          'Προς τα πού μοιάζει να πηγαίνει η αλεπού όσο εσύ μένεις δίπλα στην ανοιχτή πύλη;',
          'el'
        )}
        onContinue={() => undefined}
      />
    );

    expect(view.getByText('Reflective Questions')).toBeTruthy();
    expect(view.getByLabelText(CONTINUE_CONVERSATION_LABEL)).toBeTruthy();
  });

  it.each(ONEIROS_LANGUAGE_CODES)(
    'selects %s card microcopy from the persisted language tag',
    (languageCode) => {
      const view = render(
        <ReflectiveQuestionCard
          artifact={questionArtifact('A persisted question?', languageCode)}
          onContinue={() => undefined}
        />
      );

      expect(REFLECTIVE_QUESTION_COPY[languageCode]).toMatchObject(
        REFLECTIVE_QUESTION_UI_COPY
      );
      expect(view.getByText('Reflective Questions')).toBeTruthy();
      expect(
        view.getByLabelText(CONTINUE_CONVERSATION_LABEL)
      ).toBeTruthy();
    }
  );

  it('keeps the shared product action inside the card width', () => {
    const view = render(
      <ReflectiveQuestionCard
        artifact={questionArtifact('С каким движением сна ты хотел бы остаться?', 'ru')}
        onContinue={() => undefined}
      />
    );

    const action = view.getByLabelText(CONTINUE_CONVERSATION_LABEL);
    const label = view.getByText(CONTINUE_CONVERSATION_LABEL);

    expect(StyleSheet.flatten(action.props.style)).toMatchObject({ maxWidth: '100%' });
    expect(StyleSheet.flatten(label.props.style)).toMatchObject({ flexShrink: 1 });
  });

  it('renders no surface for a typed abstention', () => {
    const artifact = createReflectiveQuestionArtifact({
      id: 'rq-card-abstain',
      surface: 'chat',
      createdAt: '2026-08-27T12:00:00.000Z',
      abstainReason: 'semantic_abstention',
    });
    const view = render(<ReflectiveQuestionCard artifact={artifact} />);

    expect(view.queryByTestId('reflective-question-card')).toBeNull();
  });

  it('renders no question card for a valid editorial no-question ending', () => {
    const artifact = createEditorialArcQuestionArtifact({
      id: 'rq-card-no-question',
      createdAt: '2026-08-28T12:00:00.000Z',
      status: 'no_question',
      languageCode: 'el',
    });
    const view = render(<ReflectiveQuestionCard artifact={artifact} />);

    expect(view.queryByTestId('reflective-question-card')).toBeNull();
  });

  it('renders model and fallback questions identically in the card', () => {
    const question = 'Which image from the dream asks you to stay with it a little longer?';
    const model = render(
      <ReflectiveQuestionCard
        artifact={createComposerQuestionArtifact({
          id: 'rq-model',
          createdAt: '2026-08-28T12:00:00.000Z',
          question,
          languageCode: 'en',
          depth: 'core',
          source: 'model',
        })}
        onContinue={() => undefined}
        onAnswer={() => undefined}
      />
    );
    const fallback = render(
      <ReflectiveQuestionCard
        artifact={createComposerQuestionArtifact({
          id: 'rq-fallback',
          createdAt: '2026-08-28T12:00:00.000Z',
          question,
          languageCode: 'en',
          depth: 'core',
          source: 'fallback',
        })}
        onContinue={() => undefined}
        onAnswer={() => undefined}
      />
    );

    expect(model.getByText(question)).toBeTruthy();
    expect(fallback.getByText(question)).toBeTruthy();
    expect(model.getByLabelText(CONTINUE_CONVERSATION_LABEL)).toBeTruthy();
    expect(fallback.getByLabelText(CONTINUE_CONVERSATION_LABEL)).toBeTruthy();
    expect(model.getByPlaceholderText('Write what comes…')).toBeTruthy();
    expect(fallback.getByPlaceholderText('Write what comes…')).toBeTruthy();
    expect(model.queryByText('image')).toBeNull();
    expect(fallback.queryByText('fallback')).toBeNull();
  });

  it('answers from the preview field without blocking Continue the conversation', () => {
    const onContinue = jest.fn();
    const onAnswer = jest.fn();
    const view = render(
      <ReflectiveQuestionCard
        artifact={createComposerQuestionArtifact({
          id: 'rq-answer',
          createdAt: '2026-08-28T12:00:00.000Z',
          question: 'What stays between the fox crossing and your remaining at the gate?',
          languageCode: 'en',
          depth: 'core',
          source: 'model',
        })}
        onContinue={onContinue}
        onAnswer={onAnswer}
      />
    );

    fireEvent.changeText(view.getByTestId('reflective-question-card-answer'), 'The gate still feels open.');
    fireEvent.press(view.getByLabelText('Answer'));
    expect(onAnswer).toHaveBeenCalledWith('The gate still feels open.');
    fireEvent.press(view.getByLabelText(CONTINUE_CONVERSATION_LABEL));
    expect(onContinue).toHaveBeenCalled();
  });
});
