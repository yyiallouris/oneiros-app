/**
 * Output-language resolution, audit, and deterministic commit gate (E.1.1).
 *
 * Prompt language lock improves generation reliability; this module guarantees
 * wrong-language user-facing text never commits to persistence / UI.
 */

export type DreamOutputLanguageCode = 'en' | 'el';

export type DreamOutputLanguage = {
  code: DreamOutputLanguageCode;
  name: string;
};

/** Legacy audit shape (benchmark summaries). Prefer commit-gate telemetry for production. */
export type DreamOutputLanguageTelemetry = {
  target_output_language: DreamOutputLanguageCode;
  language_match: boolean;
  language_mismatch_fields: string[];
  checked_field_count: number;
};

export type OutputLanguageCommitTelemetry = {
  target_output_language: DreamOutputLanguageCode;
  initial_language_match: boolean;
  repair_attempted: boolean;
  repair_language_match: boolean | null;
  repaired_field_paths: string[];
  mismatched_field_paths: string[];
  semantic_structure_preserved: boolean;
  dropped_due_to_language_count: number;
  full_regeneration_due_to_language_count: number;
  final_commit_allowed: boolean;
  checked_field_count: number;
};

export type OutputLanguageGateResult = {
  ok: boolean;
  mismatched_field_paths: string[];
  checked_field_count: number;
  inconclusive_field_paths: string[];
};

type CollectedField = { path: string; value: string };
type FieldVerdict = 'match' | 'mismatch' | 'inconclusive';

const GREEK_LETTER = /[\u0370-\u03FF\u1F00-\u1FFF]/;
const LATIN_LETTER = /[A-Za-z]/;
const LATIN_EXTENDED =
  /[À-ÖØ-öø-ÿĀ-žḀ-ỿ]/;

const LANGUAGE_NAMES: Record<DreamOutputLanguageCode, string> = {
  en: 'English',
  el: 'Greek',
};

/** Enough letters for a per-field language decision. */
const RELIABLE_LETTER_MIN = 12;

const ENGLISH_FUNCTION_WORDS = new Set([
  'the',
  'and',
  'of',
  'to',
  'with',
  'that',
  'this',
  'from',
  'into',
  'through',
  'about',
  'between',
  'without',
  'while',
  'when',
  'where',
  'which',
  'what',
  'who',
  'how',
  'is',
  'are',
  'was',
  'were',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'not',
  'but',
  'or',
  'as',
  'at',
  'by',
  'for',
  'in',
  'on',
  'up',
  'out',
  'over',
  'under',
  'again',
  'then',
  'once',
  'my',
  'me',
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'a',
  'an',
  'his',
  'her',
  'their',
  'our',
  'your',
]);

/** Strong Latin-script non-English cues (shared alphabet with English). */
const NON_ENGLISH_LATIN_MARKERS = new Set([
  // Spanish / Portuguese
  'el',
  'la',
  'los',
  'las',
  'una',
  'unos',
  'unas',
  'del',
  'que',
  'con',
  'por',
  'para',
  'como',
  'está',
  'esta',
  'estába',
  'muy',
  'también',
  'tambien',
  'después',
  'despues',
  'porque',
  'cuando',
  'donde',
  'quién',
  'quien',
  'seu',
  'sua',
  'não',
  'nao',
  'também',
  // French
  'le',
  'les',
  'des',
  'une',
  'dans',
  'avec',
  'pour',
  'qui',
  'est',
  'sont',
  'mais',
  'pas',
  'plus',
  'tout',
  'tous',
  'cette',
  'ces',
  'mon',
  'ton',
  'son',
  'notre',
  'votre',
  'leur',
  'être',
  'etre',
  'avoir',
  // German
  'der',
  'die',
  'das',
  'und',
  'mit',
  'für',
  'fur',
  'nicht',
  'ich',
  'ein',
  'eine',
  'einen',
  'dem',
  'den',
  'auf',
  'sich',
  'auch',
  'nach',
  'oder',
  'wird',
  'sind',
  'war',
  // Italian
  'il',
  'lo',
  'gli',
  'una',
  'nel',
  'nella',
  'che',
  'per',
  'sono',
  'non',
  'anche',
  'come',
  'quando',
  'dove',
]);

export function resolveDreamOutputLanguage(
  dreamText: string,
  hint?: string | null
): DreamOutputLanguage {
  const letters = [...dreamText].filter((ch) => /\p{L}/u.test(ch));
  const greekCount = letters.filter((ch) => GREEK_LETTER.test(ch)).length;
  const greekRatio = letters.length ? greekCount / letters.length : 0;

  if (greekRatio >= 0.2) {
    return { code: 'el', name: LANGUAGE_NAMES.el };
  }
  if (letters.length > 0 && greekRatio < 0.05) {
    return { code: 'en', name: LANGUAGE_NAMES.en };
  }

  const normalizedHint = hint?.trim().toLowerCase();
  if (normalizedHint === 'el' || normalizedHint === 'greek') {
    return { code: 'el', name: LANGUAGE_NAMES.el };
  }
  return { code: 'en', name: LANGUAGE_NAMES.en };
}

export function buildOutputLanguageLockBlock(language: DreamOutputLanguage): string {
  return `TARGET OUTPUT LANGUAGE: ${language.name} (${language.code})

Write every user-facing free-text value only in ${language.name}.
Do not switch to or translate into any other natural language.

Machine IDs, enum values, mechanism tags, catalog IDs, and confidence values remain English.`;
}

function letterScriptCounts(text: string): {
  greek: number;
  latin: number;
  other: number;
  accentedLatin: number;
} {
  let greek = 0;
  let latin = 0;
  let other = 0;
  let accentedLatin = 0;
  for (const ch of text) {
    if (!/\p{L}/u.test(ch)) continue;
    if (GREEK_LETTER.test(ch)) greek += 1;
    else if (LATIN_LETTER.test(ch)) latin += 1;
    else if (LATIN_EXTENDED.test(ch)) {
      latin += 1;
      accentedLatin += 1;
    } else other += 1;
  }
  return { greek, latin, other, accentedLatin };
}

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/[a-z']+/g) ?? [];
}

function latinLooksEnglish(text: string): FieldVerdict {
  const words = tokenizeWords(text);
  if (words.length === 0) return 'inconclusive';

  let englishHits = 0;
  let foreignHits = 0;
  for (const word of words) {
    if (ENGLISH_FUNCTION_WORDS.has(word)) englishHits += 1;
    if (NON_ENGLISH_LATIN_MARKERS.has(word)) foreignHits += 1;
  }

  const { accentedLatin, latin } = letterScriptCounts(text);
  const accentRatio = latin > 0 ? accentedLatin / latin : 0;

  // Strong accent / foreign-marker signal → mismatch even when scripts overlap.
  if (accentRatio >= 0.08 && latin >= RELIABLE_LETTER_MIN) return 'mismatch';
  if (foreignHits >= 2 && foreignHits > englishHits) return 'mismatch';
  if (foreignHits >= 3 && words.length >= 4) return 'mismatch';

  if (englishHits >= 1 || words.length <= 3) {
    // Short English phrases often lack function words; treat as match when no foreign markers.
    if (foreignHits === 0) return englishHits >= 1 || words.length <= 3 ? 'match' : 'inconclusive';
  }

  if (englishHits === 0 && foreignHits === 0 && words.length >= 6) {
    // Long Latin text with no English function words is suspicious but not certain —
    // defer to packet aggregate unless accents already fired.
    return 'inconclusive';
  }

  return foreignHits > englishHits ? 'mismatch' : 'match';
}

function fieldMatchesTargetLanguage(text: string, target: DreamOutputLanguageCode): FieldVerdict {
  const trimmed = text.trim();
  if (!trimmed) return 'match';

  const { greek, latin, other } = letterScriptCounts(trimmed);
  const letters = greek + latin + other;
  if (letters === 0) return 'match';

  if (target === 'el') {
    const greekRatio = greek / letters;
    if (greekRatio >= 0.5) return 'match';
    if (letters < RELIABLE_LETTER_MIN) {
      // Short non-Greek Latin labels are inconclusive alone.
      return greek > 0 ? 'match' : 'inconclusive';
    }
    return 'mismatch';
  }

  // target === 'en'
  const nonLatin = greek + other;
  if (nonLatin / letters > 0.15) {
    // Clear wrong-script (CJK, Cyrillic, Arabic, Greek-heavy, …).
    return 'mismatch';
  }
  if (latin / letters < 0.5) {
    return letters < RELIABLE_LETTER_MIN ? 'inconclusive' : 'mismatch';
  }

  if (letters < RELIABLE_LETTER_MIN) {
    const latinVerdict = latinLooksEnglish(trimmed);
    if (latinVerdict === 'mismatch') return 'mismatch';
    return 'inconclusive';
  }

  return latinLooksEnglish(trimmed);
}

function collectDisplayDistillationFields(
  display: unknown,
  prefix: string,
  out: CollectedField[]
) {
  if (!display || typeof display !== 'object') return;
  const row = display as Record<string, unknown>;
  for (const key of ['essence_title', 'essence_line', 'main_tension', 'movement_line'] as const) {
    if (typeof row[key] === 'string' && row[key].trim()) {
      out.push({ path: `${prefix}.${key}`, value: row[key] as string });
    }
  }
  if (Array.isArray(row.visible_anchors)) {
    row.visible_anchors.forEach((anchor, index) => {
      if (!anchor || typeof anchor !== 'object') return;
      const a = anchor as Record<string, unknown>;
      if (typeof a.label === 'string' && a.label.trim()) {
        out.push({ path: `${prefix}.visible_anchors[${index}].label`, value: a.label });
      }
      if (typeof a.ui_meaning === 'string' && a.ui_meaning.trim()) {
        out.push({ path: `${prefix}.visible_anchors[${index}].ui_meaning`, value: a.ui_meaning });
      }
    });
  }
}

function collectStringArrayFields(values: unknown, path: string, out: CollectedField[]) {
  if (!Array.isArray(values)) return;
  values.forEach((value, index) => {
    if (typeof value === 'string' && value.trim()) {
      out.push({ path: `${path}[${index}]`, value });
    }
  });
}

function collectSymbolStances(values: unknown, out: CollectedField[]) {
  if (!Array.isArray(values)) return;
  values.forEach((value, index) => {
    if (!value || typeof value !== 'object') return;
    const row = value as Record<string, unknown>;
    if (typeof row.symbol === 'string' && row.symbol.trim()) {
      out.push({ path: `symbol_stances[${index}].symbol`, value: row.symbol });
    }
    if (typeof row.stance === 'string' && row.stance.trim()) {
      out.push({ path: `symbol_stances[${index}].stance`, value: row.stance });
    }
  });
}

function collectEvidenceStrings(values: unknown, path: string, out: CollectedField[]) {
  if (!Array.isArray(values)) return;
  values.forEach((value, index) => {
    if (typeof value !== 'string' || !value.trim()) return;
    // Machine evidence ids like D1 / D12 are not user-facing free text.
    if (/^D\d+$/i.test(value.trim())) return;
    out.push({ path: `${path}[${index}]`, value });
  });
}

export function collectUserFacingTextFields(parsed: Record<string, unknown>): CollectedField[] {
  const out: CollectedField[] = [];
  collectDisplayDistillationFields(parsed.display_distillation, 'display_distillation', out);

  for (const key of [
    'symbols',
    'landscapes',
    'affects',
    'motifs',
    'relational_dynamics',
    'thresholds',
    'central_conflicts',
  ] as const) {
    collectStringArrayFields(parsed[key], key, out);
  }
  collectSymbolStances(parsed.symbol_stances, out);

  if (Array.isArray(parsed.archetypes)) {
    parsed.archetypes.forEach((row, index) => {
      if (!row || typeof row !== 'object') return;
      const archetype = row as Record<string, unknown>;
      if (typeof archetype.expression === 'string' && archetype.expression.trim()) {
        out.push({ path: `archetypes[${index}].expression`, value: archetype.expression });
      }
      if (typeof archetype.resonance === 'string' && archetype.resonance.trim()) {
        out.push({ path: `archetypes[${index}].resonance`, value: archetype.resonance });
      }
      collectEvidenceStrings(archetype.evidence, `archetypes[${index}].evidence`, out);
    });
  }

  if (Array.isArray(parsed.amplifications)) {
    parsed.amplifications.forEach((row, index) => {
      if (!row || typeof row !== 'object') return;
      const myth = row as Record<string, unknown>;
      if (typeof myth.resonance === 'string' && myth.resonance.trim()) {
        out.push({ path: `amplifications[${index}].resonance`, value: myth.resonance });
      }
      if (typeof myth.divergence === 'string' && myth.divergence.trim()) {
        out.push({ path: `amplifications[${index}].divergence`, value: myth.divergence });
      }
      collectEvidenceStrings(myth.evidence, `amplifications[${index}].evidence`, out);
    });
  }

  return out;
}

/**
 * Deterministic packet language gate.
 * Hard-mismatches fail immediately; short/inconclusive fields are judged together.
 */
export function evaluateDreamExtractionOutputLanguage(
  parsed: Record<string, unknown>,
  target: DreamOutputLanguage
): OutputLanguageGateResult {
  const fields = collectUserFacingTextFields(parsed);
  const mismatched_field_paths: string[] = [];
  const inconclusive_field_paths: string[] = [];

  for (const field of fields) {
    const verdict = fieldMatchesTargetLanguage(field.value, target.code);
    if (verdict === 'mismatch') mismatched_field_paths.push(field.path);
    else if (verdict === 'inconclusive') inconclusive_field_paths.push(field.path);
  }

  if (mismatched_field_paths.length === 0 && inconclusive_field_paths.length > 0) {
    const aggregate = fields
      .filter((f) => inconclusive_field_paths.includes(f.path))
      .map((f) => f.value)
      .join(' \n ');
    const aggregateVerdict = fieldMatchesTargetLanguage(aggregate, target.code);
    if (aggregateVerdict === 'mismatch') {
      mismatched_field_paths.push(...inconclusive_field_paths);
    }
  }

  // Whole-packet sanity: if many fields are Latin/Greek but the concatenated
  // user-facing text clearly mismatches, reject the packet.
  if (mismatched_field_paths.length === 0 && fields.length > 0) {
    const allText = fields.map((f) => f.value).join(' \n ');
    const allVerdict = fieldMatchesTargetLanguage(allText, target.code);
    if (allVerdict === 'mismatch') {
      mismatched_field_paths.push(...fields.map((f) => f.path));
    }
  }

  return {
    ok: mismatched_field_paths.length === 0,
    mismatched_field_paths: [...new Set(mismatched_field_paths)],
    checked_field_count: fields.length,
    inconclusive_field_paths,
  };
}

export function auditDreamExtractionOutputLanguage(
  parsed: Record<string, unknown>,
  target: DreamOutputLanguage
): DreamOutputLanguageTelemetry {
  const gate = evaluateDreamExtractionOutputLanguage(parsed, target);
  return {
    target_output_language: target.code,
    language_match: gate.ok,
    language_mismatch_fields: gate.mismatched_field_paths,
    checked_field_count: gate.checked_field_count,
  };
}

export function buildLanguageRepairMessages(params: {
  target: DreamOutputLanguage;
  fieldsToRepair: Record<string, string>;
}): Array<{ role: 'system' | 'user'; content: string }> {
  const entries = Object.entries(params.fieldsToRepair).slice(0, 24);
  const fieldBlock = entries
    .map(([path, value]) => `- ${path}: ${JSON.stringify(value)}`)
    .join('\n');

  const system = `You repair wrong-language user-facing strings for Oneiros dream metadata.
Return ONLY a JSON object of the form:
{"fields_to_repair":{"path":"rewritten string",...}}

LANGUAGE REPAIR CONTRACT
- Rewrite only the supplied fields into ${params.target.name} (${params.target.code}).
- Repair faithfully rather than summarize.
- Preserve every interpretive claim, image, relationship, negation, qualification, uncertainty, proper name, and number.
- Do not add, remove, intensify, soften, explain, or reinterpret meaning.
- Change only the natural language.
- Do not turn uncertainty into certainty (e.g. keep "may" / "might" / "seems"; do not upgrade to "is" / "will").
- Do not drop negations (keep "not" / "never" / "without" / equivalent).
- Do not add, remove, or reinterpret archetypes, myths, IDs, mechanism tags, confidence, or evidence_ids.
- Return exactly the requested field paths as non-empty strings — no other keys, no nulls, no arrays, no objects.
- No markdown.`;

  const user = `TARGET OUTPUT LANGUAGE: ${params.target.name} (${params.target.code})

fields_to_repair (current wrong-language values):
${fieldBlock || '(none)'}

Return JSON with rewritten values only. Exact paths required. Non-empty strings only.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/** Deep-clone packet and overwrite only the repaired visible-string paths. */
export function mergeRepairedVisibleFields(
  packet: Record<string, unknown>,
  repairs: Record<string, string>
): Record<string, unknown> {
  const next = JSON.parse(JSON.stringify(packet)) as Record<string, unknown>;
  for (const [path, value] of Object.entries(repairs)) {
    if (typeof value !== 'string') continue;
    setValueAtPath(next, path, value);
  }
  return next;
}

export function collectFieldsToRepair(
  parsed: Record<string, unknown>,
  mismatchedFieldPaths: string[]
): Record<string, string> {
  const byPath = new Map(collectUserFacingTextFields(parsed).map((f) => [f.path, f.value]));
  const out: Record<string, string> = {};
  for (const path of mismatchedFieldPaths) {
    const value = byPath.get(path);
    if (typeof value === 'string') out[path] = value;
  }
  return out;
}

/**
 * Local gateway validation for field-scoped language repair payloads.
 * Shape: Record<ExactRequestedFieldPath, NonEmptyString>
 *
 * Rejects missing paths, extra paths, nulls, arrays, objects, and non-strings.
 * Used even when openai-proxy skips structured schema validation.
 */
export function validateLanguageRepairFieldMap(
  value: unknown,
  expectedPaths: string[]
): Record<string, string> | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;

  const root = value as Record<string, unknown>;
  const bagCandidate = root.fields_to_repair;
  const bag: Record<string, unknown> =
    bagCandidate != null && typeof bagCandidate === 'object' && !Array.isArray(bagCandidate)
      ? (bagCandidate as Record<string, unknown>)
      : root;

  if (Array.isArray(bag) || typeof bag !== 'object' || bag == null) return null;

  const expected = new Set(expectedPaths);
  const keys = Object.keys(bag);
  if (keys.length !== expectedPaths.length) return null;
  for (const key of keys) {
    if (!expected.has(key)) return null;
  }

  const out: Record<string, string> = {};
  for (const path of expectedPaths) {
    if (!Object.prototype.hasOwnProperty.call(bag, path)) return null;
    const fieldValue = bag[path];
    if (typeof fieldValue !== 'string') return null;
    if (!fieldValue.trim()) return null;
    out[path] = fieldValue;
  }
  return out;
}

/**
 * Parse a field-scoped repair response, then validate locally as
 * Record<ExactRequestedFieldPath, NonEmptyString>.
 */
export function parseRepairedVisibleFields(
  content: string,
  expectedPaths: string[]
): Record<string, string> | null {
  let parsed: unknown;
  try {
    const trimmed = content.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    parsed = JSON.parse((fenced?.[1]?.trim() || trimmed) as string);
  } catch {
    return null;
  }
  return validateLanguageRepairFieldMap(parsed, expectedPaths);
}

function setValueAtPath(root: Record<string, unknown>, path: string, value: string): boolean {
  const tokens = tokenizePath(path);
  if (tokens.length === 0) return false;
  let cursor: unknown = root;
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const token = tokens[i]!;
    const next = tokens[i + 1];
    if (typeof token === 'number') {
      if (!Array.isArray(cursor) || cursor[token] == null) return false;
      cursor = cursor[token];
    } else {
      if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) return false;
      const obj = cursor as Record<string, unknown>;
      if (obj[token] == null) {
        obj[token] = typeof next === 'number' ? [] : {};
      }
      cursor = obj[token];
    }
  }
  const last = tokens[tokens.length - 1]!;
  if (typeof last === 'number') {
    if (!Array.isArray(cursor)) return false;
    cursor[last] = value;
    return true;
  }
  if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) return false;
  (cursor as Record<string, unknown>)[last] = value;
  return true;
}

function tokenizePath(path: string): Array<string | number> {
  const tokens: Array<string | number> = [];
  const re = /([^[.\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(path)) !== null) {
    if (match[1]) tokens.push(match[1]);
    else if (match[2]) tokens.push(Number(match[2]));
  }
  return tokens;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(',')}}`;
}

/**
 * Structural/semantic fingerprint with selected user-facing text paths blanked.
 * Used to assert language repair never changes IDs, tags, counts, or ordering.
 */
export function semanticFingerprint(
  packet: Record<string, unknown>,
  ignoreTextPaths: string[] = []
): string {
  const clone = JSON.parse(JSON.stringify(packet)) as Record<string, unknown>;
  const paths =
    ignoreTextPaths.length > 0
      ? ignoreTextPaths
      : collectUserFacingTextFields(clone).map((field) => field.path);
  for (const path of paths) {
    setValueAtPath(clone, path, '');
  }
  return stableStringify(clone);
}

export function assertLanguageRepairPreservedStructure(params: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  repairedPaths: string[];
}): boolean {
  return (
    semanticFingerprint(params.before, params.repairedPaths) ===
    semanticFingerprint(params.after, params.repairedPaths)
  );
}

export function buildOutputLanguageCommitTelemetry(params: {
  target: DreamOutputLanguage;
  initial: OutputLanguageGateResult;
  repairAttempted: boolean;
  repair: OutputLanguageGateResult | null;
  repairedFieldPaths?: string[];
  semanticStructurePreserved: boolean;
  finalCommitAllowed: boolean;
}): OutputLanguageCommitTelemetry {
  const finalMismatch = params.finalCommitAllowed
    ? []
    : params.repair?.mismatched_field_paths ?? params.initial.mismatched_field_paths;
  return {
    target_output_language: params.target.code,
    initial_language_match: params.initial.ok,
    repair_attempted: params.repairAttempted,
    repair_language_match: params.repairAttempted ? Boolean(params.repair?.ok) : null,
    repaired_field_paths: params.repairedFieldPaths ?? [],
    mismatched_field_paths: finalMismatch,
    semantic_structure_preserved: params.semanticStructurePreserved,
    dropped_due_to_language_count: 0,
    full_regeneration_due_to_language_count: 0,
    final_commit_allowed: params.finalCommitAllowed,
    checked_field_count: params.repair?.checked_field_count ?? params.initial.checked_field_count,
  };
}

/**
 * Pure commit-gate orchestrator (no I/O).
 *
 * Contract (A — repair + preserve, never drop):
 * - On mismatch: one field-scoped repair attempt
 * - Merge repaired strings into the original packet
 * - Reject repair if semantic structure changes or language still fails
 * - Never remove fields/archetypes/myths; never partial-commit; never full regen
 */
export async function runOutputLanguageCommitGate(params: {
  parsed: Record<string, unknown>;
  target: DreamOutputLanguage;
  /** @deprecated kept for call-site compatibility; field-scoped repair no longer needs full JSON. */
  invalidContent?: string;
  /** @deprecated kept for call-site compatibility */
  originalUserPrompt?: string;
  repairOnce?: (args: {
    messages: Array<{ role: 'system' | 'user'; content: string }>;
    expectedPaths: string[];
  }) => Promise<string | Record<string, string> | null>;
}): Promise<{
  ok: boolean;
  parsed: Record<string, unknown>;
  telemetry: OutputLanguageCommitTelemetry;
}> {
  const initial = evaluateDreamExtractionOutputLanguage(params.parsed, params.target);
  if (initial.ok) {
    return {
      ok: true,
      parsed: params.parsed,
      telemetry: buildOutputLanguageCommitTelemetry({
        target: params.target,
        initial,
        repairAttempted: false,
        repair: null,
        semanticStructurePreserved: true,
        finalCommitAllowed: true,
      }),
    };
  }

  if (!params.repairOnce) {
    return {
      ok: false,
      parsed: params.parsed,
      telemetry: buildOutputLanguageCommitTelemetry({
        target: params.target,
        initial,
        repairAttempted: false,
        repair: null,
        semanticStructurePreserved: true,
        finalCommitAllowed: false,
      }),
    };
  }

  const fieldsToRepair = collectFieldsToRepair(params.parsed, initial.mismatched_field_paths);
  const repairedPaths = Object.keys(fieldsToRepair);
  const repairMessages = buildLanguageRepairMessages({
    target: params.target,
    fieldsToRepair,
  });
  const repairRaw = await params.repairOnce({
    messages: repairMessages,
    expectedPaths: repairedPaths,
  });
  const repairedFields =
    typeof repairRaw === 'string'
      ? parseRepairedVisibleFields(repairRaw, repairedPaths)
      : repairRaw && typeof repairRaw === 'object'
        ? validateLanguageRepairFieldMap(repairRaw, repairedPaths)
        : null;

  if (!repairedFields) {
    return {
      ok: false,
      parsed: params.parsed,
      telemetry: buildOutputLanguageCommitTelemetry({
        target: params.target,
        initial,
        repairAttempted: true,
        repair: {
          ok: false,
          mismatched_field_paths: initial.mismatched_field_paths,
          checked_field_count: initial.checked_field_count,
          inconclusive_field_paths: [],
        },
        repairedFieldPaths: [],
        semanticStructurePreserved: true,
        finalCommitAllowed: false,
      }),
    };
  }

  const merged = mergeRepairedVisibleFields(params.parsed, repairedFields);
  const structurePreserved = assertLanguageRepairPreservedStructure({
    before: params.parsed,
    after: merged,
    repairedPaths,
  });
  if (!structurePreserved) {
    return {
      ok: false,
      parsed: params.parsed,
      telemetry: buildOutputLanguageCommitTelemetry({
        target: params.target,
        initial,
        repairAttempted: true,
        repair: {
          ok: false,
          mismatched_field_paths: initial.mismatched_field_paths,
          checked_field_count: initial.checked_field_count,
          inconclusive_field_paths: [],
        },
        repairedFieldPaths: [],
        semanticStructurePreserved: false,
        finalCommitAllowed: false,
      }),
    };
  }

  const repair = evaluateDreamExtractionOutputLanguage(merged, params.target);
  return {
    ok: repair.ok,
    parsed: repair.ok ? merged : params.parsed,
    telemetry: buildOutputLanguageCommitTelemetry({
      target: params.target,
      initial,
      repairAttempted: true,
      repair,
      repairedFieldPaths: repair.ok ? repairedPaths : [],
      semanticStructurePreserved: true,
      finalCommitAllowed: repair.ok,
    }),
  };
}

export function summarizeOutputLanguageTelemetry(
  rows: DreamOutputLanguageTelemetry[]
): {
  runs_with_user_facing_text: number;
  user_facing_language_match_rate: number;
  mismatched_fields_by_name: Record<string, number>;
} {
  const withText = rows.filter((row) => row.checked_field_count > 0);
  const matched = withText.filter((row) => row.language_match);
  const mismatched_fields_by_name: Record<string, number> = {};

  for (const row of rows) {
    for (const field of row.language_mismatch_fields) {
      mismatched_fields_by_name[field] = (mismatched_fields_by_name[field] ?? 0) + 1;
    }
  }

  return {
    runs_with_user_facing_text: withText.length,
    user_facing_language_match_rate: withText.length ? matched.length / withText.length : 1,
    mismatched_fields_by_name,
  };
}
