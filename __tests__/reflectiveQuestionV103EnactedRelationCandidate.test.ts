import { readFileSync } from 'fs';
import path from 'path';
import {
  buildInitialReflectionRequest,
  CHAT_MODE_INSTRUCTIONS,
  SAME_CALL_QUESTION_SAFEGUARDS,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
} from '../src/ai/dreamReflectionPrompt';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
  hashReflectiveQuestionPrompt,
} from '../src/ai/reflectiveQuestionProductionHold';
import {
  buildV103EnactedRelationInitialRequest,
  V101_OBSERVATIONAL_SOMATIC_Q1,
  V103_ENACTED_RELATION_BUNDLE,
  V103_ENACTED_RELATION_BUNDLE_SHA256,
  V103_ENACTED_RELATION_CANDIDATE_STATUS,
  V103_ENACTED_RELATION_METHOD_ID,
  V103_ENACTED_RELATION_Q1,
  V103_ENACTED_RELATION_READER_PROMPT_ID,
} from '../src/ai/rd/reflective-questions/v103EnactedRelationCandidate';

const repoRoot = path.resolve(__dirname, '..');

describe('approved v1.0.3 enacted-relation production prompt', () => {
  it('pins production to the exact PO-approved frozen candidate', () => {
    expect(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
    expect(hashReflectiveQuestionPrompt(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE)).toBe(
      SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION).toEqual({
      methodId: 'oneiros-same-call-reflective-questions-v1.0.3-candidate',
      promptSha256: 'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
    });
  });

  it('replaces only the Standard/Advanced Q1 job with an enacted-event operation', () => {
    expect(V103_ENACTED_RELATION_CANDIDATE_STATUS).toBe(
      'po_approved_for_production'
    );
    expect(V103_ENACTED_RELATION_METHOD_ID).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
    expect(V103_ENACTED_RELATION_READER_PROMPT_ID).toBe(
      'oneiros-dream-reflection-v3.2.3-candidate'
    );
    expect(V103_ENACTED_RELATION_BUNDLE).not.toContain(V101_OBSERVATIONAL_SOMATIC_Q1);
    expect(V103_ENACTED_RELATION_BUNDLE.split(V103_ENACTED_RELATION_Q1)).toHaveLength(4);
    expect(V103_ENACTED_RELATION_BUNDLE).toContain(
      '- Question 2 — symbolic / relational / imaginal:'
    );
    expect(V103_ENACTED_RELATION_BUNDLE).toContain(SAME_CALL_QUESTION_SAFEGUARDS);
    expect(V103_ENACTED_RELATION_BUNDLE).toContain(CHAT_MODE_INSTRUCTIONS);
  });

  it.each(['standard', 'advanced'] as const)(
    'builds a production-parity %s request with only the Q1 text replaced',
    (depth) => {
      const dream = {
        title: 'Frozen request parity',
        date: '2026-08-29',
        content: 'I placed a cup by the window. The wind turned it once, and I steadied it.',
      };
      const production = buildInitialReflectionRequest(dream, depth);
      const candidate = buildV103EnactedRelationInitialRequest(dream, depth);
      expect(candidate.task).toBe(production.task);
      expect(candidate.temperature).toBe(production.temperature);
      expect(candidate.tokenLimit).toBe(production.tokenLimit);
      expect(candidate.reflectiveLanguageContext).toEqual(
        production.reflectiveLanguageContext
      );
      expect(candidate.messages).toHaveLength(production.messages.length);
      expect(candidate.messages).toEqual(production.messages);
      expect(production.messages[2].content).not.toContain(V101_OBSERVATIONAL_SOMATIC_Q1);
      expect(candidate.messages[2].content).not.toContain(V101_OBSERVATIONAL_SOMATIC_Q1);
      expect(candidate.messages[2].content).toContain(V103_ENACTED_RELATION_Q1);
    }
  );

  it('contains no case-specific examples, long verb menu, or v1.0.2 prohibition stack', () => {
    expect(V103_ENACTED_RELATION_Q1).not.toMatch(
      /dog|bowl|river|brother|handle|key|waits|carries|blocks|approaches|leaves|explicitly contrasts/iu
    );
    expect(V103_ENACTED_RELATION_BUNDLE).not.toContain(
      'Never supply candidate answer vocabulary'
    );
    expect(V103_ENACTED_RELATION_BUNDLE).not.toContain(
      'Do not reconstruct missing inner footage'
    );
    expect(V103_ENACTED_RELATION_BUNDLE).not.toContain(
      'Deepen the relation; do not widen the menu'
    );
  });

  it('pins the exact offline candidate SHA and keeps its paid runner explicitly gated', () => {
    expect(hashReflectiveQuestionPrompt(V103_ENACTED_RELATION_BUNDLE)).toBe(
      V103_ENACTED_RELATION_BUNDLE_SHA256
    );
    const pkg = JSON.parse(
      readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
    ) as { scripts: Record<string, string> };
    expect(pkg.scripts['benchmark:reflective-v103-enacted-relation']).toContain(
      'run-v103-enacted-relation-evaluation.ts'
    );
    const runner = readFileSync(
      path.join(
        repoRoot,
        'scripts/live/reflective-questions/run-v103-enacted-relation-evaluation.ts'
      ),
      'utf8'
    );
    expect(runner).toContain('ONEIROS_V103_ENACTED_RELATION_COST_APPROVED');
    expect(runner).toContain('cc60ad8ebe6e66a5982a6b20ef995e1c7687a51d9becdb0e2e9165d3672da1ce');
    expect(runner).toContain('Hard cost cap');
  });
});
