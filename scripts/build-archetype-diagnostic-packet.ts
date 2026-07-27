/**
 * Archetype diagnostic packet from saved benchmark JSON (no new model calls).
 *
 *   npx tsx scripts/build-archetype-diagnostic-packet.ts \
 *     tmp/patch-c11-benchmark-2026-07-27T10-54-44-546Z \
 *     tmp/5-dream-acceptance-2026-07-27T11-09-44-563Z
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
} from '../src/ai/dreamExtractionPrompt';
import {
  countPostArchetype,
  extractArchetypeStageRun,
  getArchetypeProductionSnapshot,
} from './lib/archetypeDiagnosticCatalog';

type CaseFixture = {
  id: string;
  combination: string;
  dream: string;
  expected: {
    required_archetypes: string[];
    acceptable_secondary_archetypes: string[];
    forbidden_archetypes: string[];
    required_myth_catalog_id: string | null;
    forbidden_myth_catalog_ids?: string[];
  };
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function loadCaseFixtures(): CaseFixture[] {
  const file = path.join(process.cwd(), 'docs/ONEIROS_5_DREAM_ACCEPTANCE_SET.jsonl');
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as CaseFixture);
}

function loadRunPackets(dir: string, runIds: string[]): Record<string, unknown>[] {
  return runIds.map((runId) => {
    const file = path.join(dir, `${runId}.json`);
    return readJson<Record<string, unknown>>(file);
  });
}

function main() {
  const c11Dir = process.argv[2];
  const fiveDir = process.argv[3];
  if (!c11Dir || !fiveDir) {
    throw new Error(
      'Usage: npx tsx scripts/build-archetype-diagnostic-packet.ts <c11_benchmark_dir> <five_dream_dir>'
    );
  }
  const c11Abs = path.resolve(c11Dir);
  const fiveAbs = path.resolve(fiveDir);
  const fixtures = loadCaseFixtures();
  const c3Fixture = fixtures.find((c) => c.id === 'C3_no_archetype_plus_myth');
  const c5Fixture = fixtures.find((c) => c.id === 'C5_one_archetype_plus_myth');
  if (!c3Fixture || !c5Fixture) {
    throw new Error('Missing C3 or C5 in acceptance fixture jsonl');
  }

  const sisyphusTargetedIds = ['sisyphus_r1', 'sisyphus_r2', 'sisyphus_r3', 'sisyphus_r4', 'sisyphus_r5'];
  const c3RunIds = [
    'C3_no_archetype_plus_myth_r1',
    'C3_no_archetype_plus_myth_r2',
    'C3_no_archetype_plus_myth_r3',
  ];
  const c5RunIds = [
    'C5_one_archetype_plus_myth_r1',
    'C5_one_archetype_plus_myth_r2',
    'C5_one_archetype_plus_myth_r3',
  ];

  const targetedSisyphusRuns = loadRunPackets(c11Abs, sisyphusTargetedIds).map((packet, i) =>
    extractArchetypeStageRun(packet, path.join(c11Abs, `${sisyphusTargetedIds[i]}.json`))
  );
  const c3Runs = loadRunPackets(fiveAbs, c3RunIds).map((packet, i) =>
    extractArchetypeStageRun(packet, path.join(fiveAbs, `${c3RunIds[i]}.json`))
  );
  const c5Runs = loadRunPackets(fiveAbs, c5RunIds).map((packet, i) =>
    extractArchetypeStageRun(packet, path.join(fiveAbs, `${c5RunIds[i]}.json`))
  );

  const heroTargeted = countPostArchetype(targetedSisyphusRuns, 'hero');
  const heroC3 = countPostArchetype(c3Runs, 'hero');
  const guideC5 = countPostArchetype(c5Runs, 'guide_psychopomp');
  const deathRebirthC5 = countPostArchetype(c5Runs, 'death_rebirth');

  const packet = {
    title: 'Oneiros archetype diagnostic packet',
    generated_at: new Date().toISOString(),
    purpose:
      'Inspect archetype stage objects before any catalog or acceptance changes. No new model calls.',
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    patch_c_myth_layer_status: 'complete_and_frozen',
    source_dirs: {
      c11_targeted_benchmark: c11Abs,
      five_dream_acceptance: fiveAbs,
    },
    acceptance_fixtures: {
      C3_no_archetype_plus_myth: {
        required_archetypes: c3Fixture.expected.required_archetypes,
        acceptable_secondary_archetypes: c3Fixture.expected.acceptable_secondary_archetypes,
        forbidden_archetypes: c3Fixture.expected.forbidden_archetypes,
        required_myth_catalog_id: c3Fixture.expected.required_myth_catalog_id,
      },
      C5_one_archetype_plus_myth: {
        required_archetypes: c5Fixture.expected.required_archetypes,
        acceptable_secondary_archetypes: c5Fixture.expected.acceptable_secondary_archetypes,
        forbidden_archetypes: c5Fixture.expected.forbidden_archetypes,
        required_myth_catalog_id: c5Fixture.expected.required_myth_catalog_id,
      },
    },
    production_catalog: {
      hero: getArchetypeProductionSnapshot('hero'),
      guide_psychopomp: getArchetypeProductionSnapshot('guide_psychopomp'),
      death_rebirth: getArchetypeProductionSnapshot('death_rebirth'),
    },
    diagnostic_questions: [
      'Is Hero generated with false mechanism tags, or is the Hero catalog definition too broad?',
      'Is Guide / Psychopomp in C5 an active threshold guide, a gatekeeper false positive, or helper/revival misclassification?',
      'Is Death–Rebirth absent from raw output or generated and later rejected?',
    ],
    sisyphus_hero: {
      hero_post_targeted_c11: `${heroTargeted}/${targetedSisyphusRuns.length}`,
      hero_post_five_dream_c3: `${heroC3}/${c3Runs.length}`,
      note: 'C3 expects zero archetypes; Hero is a forbidden_archetypes hit when present.',
      targeted_c11_runs: targetedSisyphusRuns,
      five_dream_c3_runs: c3Runs,
    },
    inanna_archetypes: {
      guide_post_five_dream_c5: `${guideC5}/${c5Runs.length}`,
      death_rebirth_post_five_dream_c5: `${deathRebirthC5}/${c5Runs.length}`,
      note: 'C5 requires Death–Rebirth and forbids Guide / Psychopomp.',
      five_dream_c5_runs: c5Runs,
    },
  };

  const out = path.join(process.cwd(), 'tmp/ONEIROS_ARCHETYPE_DIAGNOSTIC_PACKET.json');
  writeFileSync(out, JSON.stringify(packet, null, 2));
  console.log(
    JSON.stringify(
      {
        wrote: out,
        hero_targeted: packet.sisyphus_hero.hero_post_targeted_c11,
        hero_c3: packet.sisyphus_hero.hero_post_five_dream_c3,
        guide_c5: packet.inanna_archetypes.guide_post_five_dream_c5,
        death_rebirth_c5: packet.inanna_archetypes.death_rebirth_post_five_dream_c5,
      },
      null,
      2
    )
  );
}

main();
