/**
 * Add Patch C V2 fields to mythic_narrative_catalog.v1.json (in place).
 * Run: npx tsx scripts/migrate-myth-catalog-v2.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { MYTH_CATALOG_V2_CURATED } from './lib/mythCatalogV2Curated.ts';

const SOURCE = path.join(process.cwd(), 'src/ai/catalogs/mythic_narrative_catalog.v1.json');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function chunkPairs(groups: string[][]): string[][] {
  if (groups.length <= 4) return groups;
  const merged: string[][] = [];
  for (let i = 0; i < groups.length; i += 2) {
    merged.push(groups.slice(i, i + 2).flat());
  }
  return merged.slice(0, 4);
}

function autoV2(entry: Record<string, unknown>) {
  const defining = Array.isArray(entry.defining_cluster)
    ? (entry.defining_cluster as string[])
    : [];
  const sequence = Array.isArray(entry.narrative_sequence)
    ? (entry.narrative_sequence as string[])
    : [];
  const roles = Array.isArray(entry.relational_roles)
    ? (entry.relational_roles as string[])
    : [];
  const disqualifiers = Array.isArray(entry.disqualifiers)
    ? (entry.disqualifiers as string[])
    : [];

  const signature_features: Array<{ id: string; text: string }> = [];
  const seen = new Set<string>();
  const add = (id: string, text: string) => {
    const key = id || slugify(text);
    if (!key || seen.has(key)) return;
    seen.add(key);
    signature_features.push({ id: key, text });
  };

  for (const item of defining) add(slugify(item), item);
  for (const item of sequence) add(slugify(item), item);
  for (const item of roles.slice(0, 4)) add(`role_${slugify(item)}`, item);

  const required_feature_groups =
    sequence.length > 0
      ? chunkPairs(sequence.map((step) => [slugify(step)]))
      : chunkPairs(defining.slice(0, 4).map((item) => [slugify(item)]));

  const anti_features = disqualifiers.map((d) => ({ id: slugify(d), text: d }));

  const prompt_signature =
    sequence.length > 0
      ? sequence.join(' → ')
      : String(entry.core_synopsis || '').trim();

  return {
    prompt_signature,
    signature_features,
    required_feature_groups,
    anti_features,
  };
}

function main() {
  const raw = JSON.parse(readFileSync(SOURCE, 'utf8')) as {
    version: string;
    entries: Array<Record<string, unknown>>;
    entry_count?: number;
  };

  raw.version = '1.2.0';
  let curated = 0;
  let auto = 0;

  raw.entries = raw.entries.map((entry) => {
    const id = String(entry.id || '');
    const curatedFields = MYTH_CATALOG_V2_CURATED[id];
    const v2 = curatedFields ?? autoV2(entry);
    if (curatedFields) curated += 1;
    else auto += 1;

    const next: Record<string, unknown> & { defining_cluster?: string[] } = { ...entry, ...v2 };
    if (id === 'arabian.fisherman_and_jinni' && Array.isArray(next.defining_cluster)) {
      next.defining_cluster = (next.defining_cluster as string[]).filter(
        (c) => !/guide animal/i.test(c)
      );
    }
    return next;
  });

  raw.entry_count = raw.entries.length;
  writeFileSync(SOURCE, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
  console.log(
    JSON.stringify(
      { version: raw.version, entries: raw.entries.length, curated, auto },
      null,
      2
    )
  );
}

main();
