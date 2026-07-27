/**
 * Lightweight scorer for interpretive-echo evaluation packets.
 * Axes: grounding, archetypal function, centrality, mythic structural fit, copy quality (0–2 each → 0–10).
 */

export type EchoScoreAxis =
  | 'grounding'
  | 'archetypalFunction'
  | 'centrality'
  | 'mythicStructuralFit'
  | 'copyQuality';

export type EchoAxisScore = 0 | 1 | 2;

export type InterpretiveEchoScorecard = {
  testId: string;
  axes: Record<EchoScoreAxis, EchoAxisScore>;
  total: number;
  notes?: string;
};

export function scoreInterpretiveEchoes(input: {
  testId: string;
  axes: Record<EchoScoreAxis, EchoAxisScore>;
  notes?: string;
}): InterpretiveEchoScorecard {
  const total = (Object.values(input.axes) as EchoAxisScore[]).reduce<number>(
    (sum, n) => sum + n,
    0
  );
  return {
    testId: input.testId,
    axes: input.axes,
    total,
    notes: input.notes,
  };
}

export function meetsQualityTarget(scorecard: InterpretiveEchoScorecard): boolean {
  // Target: 8+ stably; no serious false-positive myth below 7.
  if (scorecard.total < 8) return false;
  if (scorecard.axes.mythicStructuralFit === 0 && scorecard.total < 7) return false;
  return scorecard.total >= 8;
}
