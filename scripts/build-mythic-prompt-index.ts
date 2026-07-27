/**
 * Build-time: validate mythic_narrative_catalog.v1.json and emit generated TS.
 * Patch C V2 index — complete signatures, no truncation or ellipses.
 *
 * Run: npx tsx scripts/build-mythic-prompt-index.ts
 * Optional accurate count: GPT_TOKENIZER_PATH=/tmp/tok/node_modules/gpt-tokenizer npx tsx ...
 */
import { createRequire } from 'module';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'src/ai/catalogs/mythic_narrative_catalog.v1.json');
const OUT_DIR = path.join(ROOT, 'src/ai/catalogs/generated');
const OUT_FILE = path.join(OUT_DIR, 'mythicPromptIndex.v1.ts');

const ALLOWED_SOURCE_TYPES = new Set([
  'myth',
  'mythic_cycle',
  'fairy_tale',
  'epic_episode',
  'religious_narrative',
  'alchemical_sequence',
]);

type MythFeature = { id: string; text: string };

type RawEntry = Record<string, unknown>;
type CatalogFile = { version?: unknown; entry_count?: unknown; entries?: RawEntry[] };

function asString(value: unknown, field: string, id: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Catalog entry ${id}: missing ${field}`);
  }
  return value.trim();
}

function asStringArray(value: unknown, field: string, id: string, min = 1): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Catalog entry ${id}: ${field} must be an array`);
  }
  if (value.length < min) {
    throw new Error(`Catalog entry ${id}: ${field} must have >= ${min} items`);
  }
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function asFeatures(value: unknown, field: string, id: string, min = 1): MythFeature[] {
  if (!Array.isArray(value)) {
    throw new Error(`Catalog entry ${id}: ${field} must be an array`);
  }
  if (value.length < min) {
    throw new Error(`Catalog entry ${id}: ${field} must have >= ${min} items`);
  }
  const out: MythFeature[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      throw new Error(`Catalog entry ${id}: ${field} items must be objects`);
    }
    const o = item as Record<string, unknown>;
    const fid = asString(o.id, `${field}.id`, id);
    const text = asString(o.text, `${field}.text`, id);
    if (seen.has(fid)) throw new Error(`Catalog entry ${id}: duplicate ${field} id ${fid}`);
    seen.add(fid);
    out.push({ id: fid, text });
  }
  return out;
}

function asFeatureGroups(value: unknown, id: string, featureIds: Set<string>): string[][] {
  if (!Array.isArray(value) || value.length < 1) {
    throw new Error(`Catalog entry ${id}: required_feature_groups must be a non-empty array`);
  }
  return value.map((group, gi) => {
    if (!Array.isArray(group) || group.length < 1) {
      throw new Error(`Catalog entry ${id}: required_feature_groups[${gi}] must be non-empty`);
    }
    return group.map((featId) => {
      const fid = String(featId).trim();
      if (!featureIds.has(fid)) {
        throw new Error(
          `Catalog entry ${id}: required_feature_groups references unknown feature id ${fid}`
        );
      }
      return fid;
    });
  });
}

const CURATED_FULL_INDEX_IDS = new Set([
  'arabian.fisherman_and_jinni',
  'greek.sisyphus',
  'greek.orpheus_eurydice',
  'sumerian.inanna_descent',
  'kiche_maya.hero_twins_xibalba',
  'greek.psyche_eros',
]);

function formatReqGroups(groups: string[][]): string {
  return groups.map((g) => g.join('|')).join(';');
}

function formatAntiFeatures(features: MythFeature[]): string {
  return features.map((f) => f.text).join(';');
}

function buildV2IndexBlock(entry: {
  id: string;
  prompt_signature: string;
  relational_roles: string[];
  required_feature_groups: string[][];
  anti_features: MythFeature[];
}): string {
  const req = formatReqGroups(entry.required_feature_groups);
  if (CURATED_FULL_INDEX_IDS.has(entry.id)) {
    const roles = entry.relational_roles.join('/');
    let line = `id=${entry.id} sig:${entry.prompt_signature} roles:${roles} req:${req}`;
    if (entry.anti_features.length > 0) {
      line += ` anti:${formatAntiFeatures(entry.anti_features)}`;
    }
    return line;
  }
  return `id=${entry.id} sig:${entry.prompt_signature} req:${req}`;
}

function countTokens(text: string): { tokens: number; method: string } {
  try {
    const require = createRequire(import.meta.url);
    const candidates = [
      process.env.GPT_TOKENIZER_PATH,
      path.join('/tmp/tok/node_modules/gpt-tokenizer'),
      'gpt-tokenizer',
    ].filter(Boolean) as string[];
    for (const candidate of candidates) {
      try {
        const mod = require(candidate) as { encode: (s: string) => number[] };
        if (typeof mod.encode === 'function') {
          return { tokens: mod.encode(text).length, method: `gpt-tokenizer:${candidate}` };
        }
      } catch {
        // try next
      }
    }
  } catch {
    // fall through
  }
  return { tokens: Math.ceil(text.length / 4.2), method: 'char_estimate_/4.2' };
}

function main() {
  const raw = JSON.parse(readFileSync(SOURCE, 'utf8')) as CatalogFile;
  const version = asString(raw.version, 'version', 'catalog');
  const entries = Array.isArray(raw.entries) ? raw.entries : null;
  if (!entries) throw new Error('Catalog missing entries[]');
  if (typeof raw.entry_count === 'number' && raw.entry_count !== entries.length) {
    throw new Error(`entry_count ${raw.entry_count} != entries.length ${entries.length}`);
  }

  const seen = new Set<string>();
  const normalized = entries.map((entry, index) => {
    const id = asString(entry.id, 'id', `#${index}`);
    if (seen.has(id)) throw new Error(`Duplicate catalog id: ${id}`);
    seen.add(id);
    const source_type = asString(entry.source_type, 'source_type', id);
    if (!ALLOWED_SOURCE_TYPES.has(source_type)) {
      throw new Error(`Unsupported source_type for ${id}: ${source_type}`);
    }

    const prompt_signature = asString(entry.prompt_signature, 'prompt_signature', id);
    if (/…|\.\.\./.test(prompt_signature)) {
      throw new Error(`Catalog entry ${id}: prompt_signature must not contain ellipses`);
    }

    const signature_features = asFeatures(entry.signature_features, 'signature_features', id, 3);
    const featureIds = new Set(signature_features.map((f) => f.id));
    const required_feature_groups = asFeatureGroups(entry.required_feature_groups, id, featureIds);
    const anti_features = asFeatures(entry.anti_features ?? [], 'anti_features', id, 0);

    return {
      id,
      canonical_title: asString(entry.canonical_title, 'canonical_title', id),
      tradition_display: asString(entry.tradition_display, 'tradition_display', id),
      source_type,
      core_synopsis: asString(entry.core_synopsis, 'core_synopsis', id),
      narrative_sequence: asStringArray(entry.narrative_sequence, 'narrative_sequence', id),
      relational_roles: asStringArray(entry.relational_roles, 'relational_roles', id),
      disqualifiers: asStringArray(entry.disqualifiers, 'disqualifiers', id, 0),
      defining_cluster: asStringArray(entry.defining_cluster ?? [], 'defining_cluster', id, 0),
      usage_tier: typeof entry.usage_tier === 'string' ? entry.usage_tier.trim() : 'public_reference',
      prompt_signature,
      signature_features,
      required_feature_groups,
      anti_features,
    };
  });

  const index = normalized.map((entry) => buildV2IndexBlock(entry)).join('\n');

  const tokenInfo = countTokens(index);
  if (tokenInfo.tokens > 10000) {
    throw new Error(
      `V2 myth index is ${tokenInfo.tokens} tokens (${tokenInfo.method}) > 10k. Needs product approval before ship.`
    );
  }

  const catalogRecord = Object.fromEntries(
    normalized.map((entry) => [
      entry.id,
      {
        id: entry.id,
        canonical_title: entry.canonical_title,
        tradition_display: entry.tradition_display,
        source_type: entry.source_type,
        narrative_sequence: entry.narrative_sequence,
        relational_roles: entry.relational_roles,
        disqualifiers: entry.disqualifiers,
        defining_cluster: entry.defining_cluster,
        usage_tier: entry.usage_tier,
        prompt_signature: entry.prompt_signature,
        signature_features: entry.signature_features,
        required_feature_groups: entry.required_feature_groups,
        anti_features: entry.anti_features,
      },
    ])
  );

  mkdirSync(OUT_DIR, { recursive: true });
  const file = `/* AUTO-GENERATED by scripts/build-mythic-prompt-index.ts — do not edit by hand. */
export const MYTHIC_CATALOG_VERSION = ${JSON.stringify(version)} as const;
export const MYTHIC_CATALOG_ENTRY_COUNT = ${normalized.length} as const;
export const MYTHIC_PROMPT_INDEX_VERSION = 2 as const;
export const MYTHIC_PROMPT_INDEX_TOKEN_COUNT = ${tokenInfo.tokens} as const;
export const MYTHIC_PROMPT_INDEX_TOKEN_METHOD = ${JSON.stringify(tokenInfo.method)} as const;

export type MythFeature = {
  id: string;
  text: string;
};

export type MythicNarrativeCatalogEntry = {
  id: string;
  canonical_title: string;
  tradition_display: string;
  source_type: string;
  narrative_sequence: string[];
  relational_roles: string[];
  disqualifiers: string[];
  defining_cluster: string[];
  usage_tier: string;
  prompt_signature: string;
  signature_features: MythFeature[];
  required_feature_groups: string[][];
  anti_features: MythFeature[];
};

export const MYTHIC_CATALOG_BY_ID: Record<string, MythicNarrativeCatalogEntry> = ${JSON.stringify(
    catalogRecord,
    null,
    2
  )};

export const MYTHIC_PROMPT_INDEX = ${JSON.stringify(index)};
`;

  writeFileSync(OUT_FILE, file, 'utf8');
  console.log(
    JSON.stringify(
      {
        version,
        indexVersion: 2,
        entryCount: normalized.length,
        tokenCount: tokenInfo.tokens,
        tokenMethod: tokenInfo.method,
        outFile: path.relative(ROOT, OUT_FILE),
        indexChars: index.length,
        overPreferred8k: tokenInfo.tokens > 8000,
      },
      null,
      2
    )
  );
}

main();
