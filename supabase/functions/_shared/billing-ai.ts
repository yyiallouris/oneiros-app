import type { DisplayDistillation } from '../../../src/types/dream.ts';
import type { GatewayAction } from '../../../src/billing/types.ts';
import { buildCurrentMonthScope, getRecentSequenceScopeKey } from '../../../src/billing/policy.ts';
import type { PatternEntry } from './billing-db.ts';
import { HttpError } from './http.ts';
import { getFunctionsBaseUrl, getServiceRoleKey } from './supabase.ts';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

type DreamRecord = {
  id: string;
  title: string | null;
  date: string;
  content: string;
};

type ExtractionResult = {
  display_distillation?: DisplayDistillation;
  symbols: string[];
  archetypes: string[];
  landscapes: string[];
  affects: string[];
  motifs: string[];
  relational_dynamics: string[];
  thresholds: string[];
  central_conflicts: string[];
  core_mode: string | null;
  amplifications: string[];
  symbol_stances: Array<{ symbol: string; stance: string }>;
};

function requestId(): string {
  return crypto.randomUUID();
}

async function invokeOpenAiProxy(params: {
  task: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature: number;
  tokenLimit: number;
  responseFormat?: { type: 'json_object' };
}): Promise<Record<string, unknown>> {
  const response = await fetch(`${getFunctionsBaseUrl()}/openai-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: getServiceRoleKey(),
      Authorization: `Bearer ${getServiceRoleKey()}`,
      'X-Request-Id': requestId(),
    },
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      task: params.task,
      messages: params.messages,
      temperature: params.temperature,
      max_completion_tokens: params.tokenLimit,
      max_tokens: params.tokenLimit,
      response_format: params.responseFormat,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new HttpError(response.status, 'AI proxy request failed', data);
  }

  return data as Record<string, unknown>;
}

function extractContent(payload: Record<string, unknown>): string {
  const choices = Array.isArray(payload.choices) ? payload.choices as Array<Record<string, unknown>> : [];
  const first = choices[0] ?? {};
  const message = (first.message ?? {}) as Record<string, unknown>;
  const content = message.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new HttpError(502, 'AI proxy returned empty content');
  }
  return content.trim();
}

function trim(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function buildReflectionMessages(dream: DreamRecord, depth: 'quick' | 'standard' | 'advanced') {
  const system = `You are Dream Weaver, a psychologically precise post-Jungian dream reader.
Write one grounded symbolic reflection.
Stay hypothetical, image-near, and concise.
Do not diagnose, advise, or moralize.
Return plain markdown paragraphs only.`;
  const target = depth === 'quick' ? '120-220 words' : depth === 'advanced' ? '450-700 words' : '220-420 words';
  const user = `Dream title: ${dream.title || 'Untitled'}
Dream date: ${dream.date}

Dream:
${dream.content}

Write a symbolic reflection grounded in the dream images and movement.
Length target: ${target}.`;

  return {
    task: depth === 'quick' ? 'interpretation_quick' : depth === 'advanced' ? 'interpretation_advanced' : 'interpretation_standard',
    messages: [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ],
    temperature: 0.55,
    tokenLimit: depth === 'quick' ? 650 : depth === 'advanced' ? 2200 : 1500,
  };
}

function buildExtractionMessages(dream: DreamRecord, interpretation: string) {
  const system = `Return a single JSON object with keys:
display_distillation, symbols, symbol_stances, archetypes, landscapes, affects, motifs, relational_dynamics, thresholds, central_conflicts, core_mode, amplifications.
Do not include any prose outside JSON.`;
  const user = `Title: ${dream.title || 'Untitled'}
Date: ${dream.date}

Dream:
${dream.content}

Final interpretation:
${interpretation}

Populate only what the dream text and interpretation concretely support.`;

  return {
    task: 'dream_extraction',
    messages: [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ],
    temperature: 0.2,
    tokenLimit: 2200,
    responseFormat: { type: 'json_object' as const },
  };
}

function buildFollowupMessages(dream: DreamRecord, conversation: ChatMessage[], userMessage: string, isFinalResponse: boolean) {
  const history = conversation
    .slice(-10)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n\n');

  const system = `You are continuing a symbolic dream reflection.
Be concise, grounded, and psychologically precise.
Do not redo the full interpretation.
${isFinalResponse ? 'This is the final allowed assistant reply. Conclude without inviting another question.' : 'End with one reflective question.'}`;

  const user = `Dream title: ${dream.title || 'Untitled'}
Dream date: ${dream.date}
Dream text:
${trim(dream.content, 1400)}

Existing conversation:
${history || '(none)'}

New user message:
${userMessage}`;

  return {
    task: 'chat_followup',
    messages: [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ],
    temperature: 0.6,
    tokenLimit: 900,
  };
}

function buildRecentEssayMessages(entries: PatternEntry[], language: string) {
  const context = entries.map((entry, index) => `
Dream ${index + 1}
Date: ${entry.date}
Symbols: ${entry.extracted.symbols.join(', ') || '(none)'}
Affects: ${entry.extracted.affects.join(', ') || '(none)'}
Motifs: ${entry.extracted.motifs.join('; ') || '(none)'}
Thresholds: ${entry.extracted.thresholds.join('; ') || '(none)'}
Conflicts: ${entry.extracted.central_conflicts.join('; ') || '(none)'}
Interpretation excerpt: ${trim(entry.interpretation, 500)}
`).join('\n');

  return {
    task: 'pattern_insights',
    messages: [
      {
        role: 'system' as const,
        content: `You are writing a recent symbolic dream-field reflection. Keep markdown headings in English. Write the body in ${language}.`,
      },
      {
        role: 'user' as const,
        content: `Use these recent reflected dreams:
${context}

Write sections:
## Recent Dream Field
## What Keeps Returning
## Current Movement
## What Remains Open
## Reflective Questions

No advice or diagnosis.`,
      },
    ],
    temperature: 0.46,
    tokenLimit: 1500,
  };
}

function buildPeriodEssayMessages(entries: PatternEntry[], monthKey: string, language: string) {
  const context = entries.map((entry, index) => `
Dream ${index + 1}
Date: ${entry.date}
Symbols: ${entry.extracted.symbols.join(', ') || '(none)'}
Affects: ${entry.extracted.affects.join(', ') || '(none)'}
Motifs: ${entry.extracted.motifs.join('; ') || '(none)'}
Thresholds: ${entry.extracted.thresholds.join('; ') || '(none)'}
Conflicts: ${entry.extracted.central_conflicts.join('; ') || '(none)'}
Interpretation excerpt: ${trim(entry.interpretation, 600)}
`).join('\n');

  return {
    task: 'pattern_insights',
    messages: [
      {
        role: 'system' as const,
        content: `You are writing a symbolic monthly dream-field reflection. Keep markdown headings in English. Write the body in ${language}.`,
      },
      {
        role: 'user' as const,
        content: `Month key: ${monthKey}
Reflected dreams:
${context}

Write sections:
## The Month's Dream Field
## Recurring Images and Pressures
## Thresholds and Conflicts
## Movement Across the Month
## What Remains Open
## Reflective Questions

No advice or diagnosis.`,
      },
    ],
    temperature: 0.48,
    tokenLimit: entries.length >= 5 ? 2200 : 1700,
  };
}

function parseExtraction(content: string): ExtractionResult {
  const parsed = JSON.parse(content) as Partial<ExtractionResult>;
  return {
    display_distillation: parsed.display_distillation,
    symbols: parsed.symbols ?? [],
    archetypes: parsed.archetypes ?? [],
    landscapes: parsed.landscapes ?? [],
    affects: parsed.affects ?? [],
    motifs: parsed.motifs ?? [],
    relational_dynamics: parsed.relational_dynamics ?? [],
    thresholds: parsed.thresholds ?? [],
    central_conflicts: parsed.central_conflicts ?? [],
    core_mode: parsed.core_mode ?? null,
    amplifications: parsed.amplifications ?? [],
    symbol_stances: parsed.symbol_stances ?? [],
  };
}

export async function generateDreamInterpretation(params: {
  dream: DreamRecord;
  depth: 'quick' | 'standard' | 'advanced';
}): Promise<{ text: string; extraction: ExtractionResult }> {
  const reflectionPayload = await invokeOpenAiProxy(buildReflectionMessages(params.dream, params.depth));
  const text = extractContent(reflectionPayload);
  const extractionPayload = await invokeOpenAiProxy(buildExtractionMessages(params.dream, text));
  const extraction = parseExtraction(extractContent(extractionPayload));
  return { text, extraction };
}

export async function generateFollowupReply(params: {
  dream: DreamRecord;
  conversation: ChatMessage[];
  userMessage: string;
  assistantRepliesUsed: number;
  assistantRepliesLimit: number;
}): Promise<string> {
  const payload = await invokeOpenAiProxy(
    buildFollowupMessages(
      params.dream,
      params.conversation,
      params.userMessage,
      params.assistantRepliesUsed + 1 >= params.assistantRepliesLimit
    )
  );
  return extractContent(payload);
}

export async function generateRecentReflection(entries: PatternEntry[], language: string): Promise<string> {
  const payload = await invokeOpenAiProxy(buildRecentEssayMessages(entries, language));
  return extractContent(payload);
}

export async function generatePeriodReflection(entries: PatternEntry[], monthKey: string, language: string): Promise<string> {
  const payload = await invokeOpenAiProxy(buildPeriodEssayMessages(entries, monthKey, language));
  return extractContent(payload);
}

export function buildRecentScope(entries: PatternEntry[], count: number): string {
  return getRecentSequenceScopeKey(entries.map((entry) => entry.dreamId), count);
}

export function buildMonthScope(monthKey: string, timeZone: string): {
  scopeKey: string;
  startDate: string;
  endDate: string;
  isCurrentMonth: boolean;
} {
  const now = new Date();
  const current = buildCurrentMonthScope(now, timeZone);
  if (monthKey === current.monthKey) {
    return {
      scopeKey: current.scopeKey,
      startDate: current.startDate,
      endDate: current.endDate,
      isCurrentMonth: true,
    };
  }

  const [year, month] = monthKey.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    scopeKey: monthKey,
    startDate: `${monthKey}-01`,
    endDate: `${monthKey}-${String(lastDay).padStart(2, '0')}`,
    isCurrentMonth: false,
  };
}
