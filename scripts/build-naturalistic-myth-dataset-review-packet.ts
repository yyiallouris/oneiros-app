import { createHash } from 'crypto';
import { writeFileSync } from 'fs';
import path from 'path';
import {
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
} from '../src/ai/dreamExtractionPrompt';
import { MYTHIC_CATALOG_VERSION } from '../src/ai/catalogs/mythicNarrativeCatalog';
import { MYTHIC_PROMPT_INDEX_VERSION } from '../src/ai/catalogs/mythicPromptIndex';
import {
  NATURALISTIC_MYTH_BENCHMARK_FIXTURES,
  MYTH_NATURALISTIC_CALIBRATION_VERSION,
} from './lib/naturalisticMythBenchmarkFixtures';
import { detectNaturalisticMythDatasetLeakage } from './lib/naturalisticMythBenchmarkLeakage';
import { validateNaturalisticMythFixtures } from './lib/naturalisticMythBenchmark';

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function dreamHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

function main() {
  validateNaturalisticMythFixtures(NATURALISTIC_MYTH_BENCHMARK_FIXTURES);
  const leakage = detectNaturalisticMythDatasetLeakage(NATURALISTIC_MYTH_BENCHMARK_FIXTURES);
  const byArm = NATURALISTIC_MYTH_BENCHMARK_FIXTURES.reduce<Record<string, number>>((acc, fixture) => {
    acc[fixture.arm] = (acc[fixture.arm] ?? 0) + 1;
    return acc;
  }, {});
  const byLanguage = NATURALISTIC_MYTH_BENCHMARK_FIXTURES.reduce<Record<string, number>>((acc, fixture) => {
    acc[fixture.dream_language] = (acc[fixture.dream_language] ?? 0) + 1;
    return acc;
  }, {});

  const packet = {
    title: 'Oneiros naturalistic myth calibration — dataset review packet',
    generated_at: new Date().toISOString(),
    purpose: 'Pre-run freeze review — fixtures, leakage, and distribution only.',
    dataset_version: MYTH_NATURALISTIC_CALIBRATION_VERSION,
    frozen_runtime_baseline: {
      prompt_id: DREAM_EXTRACTION_PROMPT_ID,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
      schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
      myth_catalog_version: MYTHIC_CATALOG_VERSION,
      myth_prompt_index_version: MYTHIC_PROMPT_INDEX_VERSION,
      requested_brief_baseline: '4.1.7-E',
      repository_runtime_on_2026_07_27: DREAM_EXTRACTION_PROMPT_VERSION,
      expected_model: 'gpt-5.4-mini-2026-03-17',
      fallback_disabled: true,
    },
    statistics: {
      total: NATURALISTIC_MYTH_BENCHMARK_FIXTURES.length,
      by_arm: byArm,
      by_language: byLanguage,
      word_count: {
        min: Math.min(...NATURALISTIC_MYTH_BENCHMARK_FIXTURES.map((fixture) => wordCount(fixture.dream_text))),
        max: Math.max(...NATURALISTIC_MYTH_BENCHMARK_FIXTURES.map((fixture) => wordCount(fixture.dream_text))),
      },
    },
    validation: {
      leakage,
      leakage_report_file: 'docs/ONEIROS_MYTH_NATURALISTIC_CALIBRATION_BENCHMARK_LEAKAGE.json',
      fixture_contract_valid: true,
    },
    fixtures: NATURALISTIC_MYTH_BENCHMARK_FIXTURES.map((fixture) => ({
      ...fixture,
      dream_hash: dreamHash(fixture.dream_text),
      word_count: wordCount(fixture.dream_text),
    })),
  };

  const outJson = path.join(process.cwd(), 'tmp/ONEIROS_MYTH_NATURALISTIC_DATASET_REVIEW_PACKET.json');
  writeFileSync(outJson, JSON.stringify(packet, null, 2));

  const outMd = path.join(process.cwd(), 'tmp/ONEIROS_MYTH_NATURALISTIC_DATASET_REVIEW_PACKET.md');
  writeFileSync(
    outMd,
    `# Oneiros naturalistic myth dataset review packet\n\nGenerated: ${packet.generated_at}\n\n- Total fixtures: ${packet.statistics.total}\n- Arm counts: ${Object.entries(byArm)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ')}\n- Language counts: ${Object.entries(byLanguage)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ')}\n- Leakage fixtures with hits: ${leakage.fixtures_with_hits}\n`
  );

  console.log(
    JSON.stringify(
      {
        wrote_json: outJson,
        wrote_md: outMd,
        dataset_version: MYTH_NATURALISTIC_CALIBRATION_VERSION,
        fixture_count: NATURALISTIC_MYTH_BENCHMARK_FIXTURES.length,
      },
      null,
      2
    )
  );
}

main();
