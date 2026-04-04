/**
 * Flow coverage: interpretation limits & auth constants (documentation/flows-06, flows-02).
 */
import { MIN_PASSWORD_LENGTH } from '../../src/constants/auth';
import { MAX_AI_RESPONSES, MAX_FOLLOW_UP_RESPONSES } from '../../src/constants/interpretation';

describe('flow-related constants', () => {
  it('MIN_PASSWORD_LENGTH matches app validation', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  it('MAX_AI_RESPONSES is initial plus follow-ups', () => {
    expect(MAX_AI_RESPONSES).toBe(1 + MAX_FOLLOW_UP_RESPONSES);
    expect(MAX_AI_RESPONSES).toBe(4);
  });
});
