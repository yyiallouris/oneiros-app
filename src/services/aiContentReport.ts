export const AI_REPORT_REASONS = [
  'Offensive or hateful',
  'Unsafe or harmful',
  'Sexual content',
  'Misleading',
  'Other',
] as const;

export type AiReportReason = (typeof AI_REPORT_REASONS)[number];

export type AiReportSurface =
  | 'dream_reflection'
  | 'exploring_reply'
  | 'recent_dream_field'
  | 'period_reflection';

export type AiReportContext = {
  surface: AiReportSurface;
  referenceId: string;
};

const SURFACE_LABELS: Record<AiReportSurface, string> = {
  dream_reflection: 'Dream reflection',
  exploring_reply: 'Exploring reply',
  recent_dream_field: 'Recent Dream Field',
  period_reflection: 'Period Reflection',
};

export function getAiReportSurfaceLabel(surface: AiReportSurface): string {
  return SURFACE_LABELS[surface];
}

export function sanitizeAiReportReference(referenceId: string): string {
  const sanitized = referenceId.trim().replace(/[^a-zA-Z0-9._:-]/g, '-').slice(0, 160);
  return sanitized || 'unavailable';
}

export function buildAiReportMessage(
  context: AiReportContext,
  reason: AiReportReason,
  note: string,
): { subject: string; message: string } {
  const surfaceLabel = getAiReportSurfaceLabel(context.surface);
  const safeReference = sanitizeAiReportReference(context.referenceId);
  const trimmedNote = note.trim();
  return {
    subject: `AI response report: ${surfaceLabel}`,
    message: [
      'AI response report',
      `Surface: ${surfaceLabel}`,
      `Reference: ${safeReference}`,
      `Reason: ${reason}`,
      trimmedNote ? `User note:\n${trimmedNote}` : null,
    ].filter(Boolean).join('\n'),
  };
}
