/**
 * Flow coverage: documentation/architecture-interpretation.md and flows-10-subscriptions-billing.md
 * (safe AI token-cost logging for reflection, metadata, Recent Dream Field, and Period Reflection).
 */
import { readFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, OPENAI_STANDARD_PRICING_SOURCE } from '../../src/billing/aiPricing';

const repoRoot = path.resolve(__dirname, '../..');

describe('AI cost logging flow', () => {
  it('estimates costs from provider usage tokens via the shared monthly pricing table', () => {
    const pricing = readFileSync(path.join(repoRoot, 'src/billing/aiPricing.ts'), 'utf8');
    const billingAi = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts'), 'utf8');

    expect(pricing).toMatch(/AI_PRICING_CHECKED_AT = '2026-07-24'/);
    expect(pricing).toMatch(/https:\/\/developers\.openai\.com\/api\/docs\/pricing/);
    expect(pricing).toMatch(/'gpt-5\.4': \{ inputUsdPer1m: 2\.5, cachedInputUsdPer1m: 0\.25, outputUsdPer1m: 15 \}/);
    expect(pricing).toMatch(/'gpt-5\.4-mini': \{ inputUsdPer1m: 0\.75, cachedInputUsdPer1m: 0\.075, outputUsdPer1m: 4\.5 \}/);
    expect(pricing).toMatch(/'claude-haiku-4-5': \{ inputUsdPer1m: 1, cachedInputUsdPer1m: 0\.1, outputUsdPer1m: 5 \}/);
    expect(pricing).toMatch(/'claude-sonnet-5': \{ inputUsdPer1m: 2, cachedInputUsdPer1m: 0\.2, outputUsdPer1m: 10 \}/);
    expect(pricing).toMatch(/export function estimateAiCallCost/);
    expect(OPENAI_STANDARD_PRICING_SOURCE).toBe('openai_standard_short_context_2026_07_24');

    expect(billingAi).toMatch(/from '\.\.\/\.\.\/\.\.\/src\/billing\/aiPricing\.ts'/);
    expect(billingAi).toMatch(/estimateAiCallCost/);
    expect(billingAi).toMatch(/Object\.defineProperty\(payload, AI_COST_FIELD/);
    expect(billingAi).toMatch(/generateDreamReflectionWithCost/);
    expect(billingAi).toMatch(/generateDreamExtractionWithCost/);
    expect(billingAi).toMatch(/generateRecentReflection/);
    expect(billingAi).toMatch(/generatePeriodReflection/);
    expect(billingAi).toMatch(/contractValidation: ReflectiveContractObservation/);
    expect(billingAi).toMatch(/invokeOpenAiProxyStream/);
    expect(billingAi).toMatch(/stream_options: \{ include_usage: true \}/);
    expect(billingAi).toMatch(/delta\.content/);
    expect(billingAi).toMatch(/failOnInvalidOrEmpty: true/);
    expect(billingAi).toMatch(/AI extraction returned invalid JSON/);
    expect(billingAi).toMatch(/AI extraction returned no usable metadata/);
  });

  it('prices OpenAI and Anthropic models dynamically from the shared table', () => {
    const openai = estimateAiCallCost(
      {
        model: 'gpt-5.4-2026-03-01',
        usage: {
          prompt_tokens: 1_000_000,
          completion_tokens: 1_000_000,
          total_tokens: 2_000_000,
          prompt_tokens_details: { cached_tokens: 200_000 },
        },
      },
      'openai'
    );
    expect(openai.pricingModel).toBe('gpt-5.4');
    expect(openai.pricingSource).toBe('openai_standard_short_context_2026_07_24');
    // billable input 800k * 2.5 + cached 200k * 0.25 + output 1M * 15
    expect(openai.estimatedUsd).toBe(17.05);

    const anthropic = estimateAiCallCost(
      {
        model: 'claude-haiku-4-5-20251001',
        usage: {
          prompt_tokens: 1_000_000,
          completion_tokens: 500_000,
          total_tokens: 1_500_000,
        },
      },
      'anthropic'
    );
    expect(anthropic.pricingModel).toBe('claude-haiku-4-5');
    expect(anthropic.estimatedUsd).toBe(3.5);

    const sonnet = estimateAiCallCost(
      {
        model: 'claude-sonnet-5',
        usage: {
          prompt_tokens: 1_000_000,
          completion_tokens: 500_000,
          total_tokens: 1_500_000,
        },
      },
      'anthropic'
    );
    expect(sonnet.pricingModel).toBe('claude-sonnet-5');
    // 1M * 2 + 0.5M * 10
    expect(sonnet.estimatedUsd).toBe(7);

    const unknown = estimateAiCallCost(
      {
        model: 'mystery-model',
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      },
      'openai'
    );
    expect(unknown.pricingSource).toBe('unknown_provider_or_model');
    expect(unknown.estimatedUsd).toBeNull();
  });

  it('propagates reflection, metadata, and Insights essay costs through gateway responses and logs', () => {
    const gateway = readFileSync(path.join(repoRoot, 'supabase/functions/ai-entitlements-gateway/index.ts'), 'utf8');
    const service = readFileSync(path.join(repoRoot, 'src/services/entitledAiService.ts'), 'utf8');
    const dreamDetailScreen = readFileSync(path.join(repoRoot, 'src/screens/DreamDetailScreen.tsx'), 'utf8');
    const clientAi = readFileSync(path.join(repoRoot, 'src/services/ai.ts'), 'utf8');

    expect(gateway).toMatch(/reflection_ai_cost/);
    expect(gateway).toMatch(/partial_reflection/);
    expect(gateway).toMatch(/patchQuotaEventResultContext/);
    expect(gateway).toMatch(/reflection_cost_usd/);
    expect(gateway).toMatch(/metadata_ai_cost/);
    expect(gateway).toMatch(/metadata_cost_usd/);
    expect(gateway).toMatch(/total_ai_cost_usd/);
    expect(gateway).toMatch(/reflection total ai cost/);
    expect(gateway).toMatch(/claimMetadataExtraction/);
    expect(gateway).toMatch(/metadata request already processing/);
    expect(gateway).toMatch(/reason: 'metadata_extraction_processing'/);
    expect(gateway.indexOf('claimMetadataExtraction')).toBeLessThan(gateway.indexOf('persistReflectionMetadata'));
    expect(gateway).toMatch(/finishMetadataExtraction\(admin, userId, interpretation\.id, 'completed'\)/);
    expect(gateway).toMatch(/finishMetadataExtraction\(\s*admin,\s*userId,\s*interpretation\.id,\s*'failed'/);
    expect(gateway).toMatch(/origin_quota_event_id/);
    expect(gateway).toMatch(/metadata_status: 'failed'/);
    expect(gateway).toMatch(/throw httpError \?\? new HttpError\(502, 'Metadata extraction failed'\)/);
    expect(gateway).toMatch(/metadata extraction failed/);
    expect(gateway).toMatch(/details: httpError\?\.details/);
    expect(gateway).toMatch(/recent dream field ai start/);
    expect(gateway).toMatch(/recent dream field ai done/);
    expect(gateway).toMatch(/recent_dream_field_ai_cost/);
    expect(gateway).toMatch(/recent_dream_field_cost_usd/);
    expect(gateway).toMatch(/period reflection ai start/);
    expect(gateway).toMatch(/period reflection ai done/);
    expect(gateway).toMatch(/period_reflection_ai_cost/);
    expect(gateway).toMatch(/period_reflection_cost_usd/);
    expect(gateway).toMatch(/contract_validation/);
    expect(gateway).toMatch(/chat_followup_ai_ms/);

    expect(service).toMatch(/reflectionCostUsd/);
    expect(service).toMatch(/REFLECTION_PARTIAL_REVEAL_AFTER_MS = 15000/);
    expect(service).toMatch(/onPartialReflection/);
    expect(service).toMatch(/ensureDreamMetadataExtraction/);
    expect(service).toMatch(/metadataExtractionInFlight = new Map/);
    expect(service).toMatch(/dream_metadata_extract_already_processing/);
    expect(service).toMatch(/metadata_extraction_processing/);
    expect(service).toMatch(/metadataCostUsd/);
    expect(service).toMatch(/costModel: response\.metadata_ai_cost\?\.model/);
    expect(service).toMatch(/reflectionCostModel: response\.reflection_ai_cost\?\.model/);
    expect(service).toMatch(/totalAiCostUsd/);
    expect(service).toMatch(/dream_reflection_gateway_committed/);
    expect(service).toMatch(/costModel: response\.reflection_ai_cost\?\.model/);
    expect(service).toMatch(/recent_dream_field_gateway_committed/);
    expect(service).toMatch(/costUsd: response\.recent_dream_field_cost_usd/);
    expect(service).toMatch(/period_reflection_gateway_committed/);
    expect(service).toMatch(/costUsd: response\.period_reflection_cost_usd/);
    expect(gateway).toMatch(/reflection_ai_cost: safeCostLog\(reflectionCost\)/);
    expect(gateway).toMatch(/reflection_cost_usd: costUsd\(reflectionCost\)/);

    expect(clientAi).toMatch(/from '\.\.\/billing\/aiPricing'/);
    expect(clientAi).toMatch(/estimateSimpleTokenCost/);

    expect(dreamDetailScreen).toMatch(/isStreaming\?: boolean/);
    expect(dreamDetailScreen).toMatch(/\(isTyping \|\| isStreaming\) && !isUser/);
    expect(dreamDetailScreen).toMatch(/!isTyping && !isStreaming/);
    expect(dreamDetailScreen).toMatch(/hadStreamingReflectionRef/);
    expect(dreamDetailScreen).toMatch(/shouldTypeFinalReflection = !hadStreamingReflectionRef\.current/);
    expect(dreamDetailScreen).toMatch(/No overflow:'hidden' \/ flex:1/);
    expect(dreamDetailScreen).toMatch(/chatScrollViewStreaming/);
    expect(dreamDetailScreen).toMatch(/ensureDreamMetadataExtraction\(nextInterpretation\.id\)\.then/);
    expect(dreamDetailScreen).toMatch(/Dream details are still forming/);
    expect(dreamDetailScreen).toMatch(/refreshInterpretationMetadata\(interpretation\.id\)/);
  });

  it('guards metadata extraction cost logging with a server-side lease claim', () => {
    const migration = readFileSync(
      path.join(repoRoot, 'supabase/migrations/20260725100000_add_metadata_extraction_claims.sql'),
      'utf8'
    );
    const billingDb = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-db.ts'), 'utf8');
    const gatewayReadme = readFileSync(path.join(repoRoot, 'supabase/functions/ai-entitlements-gateway/README.md'), 'utf8');

    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS interpretation_metadata_extraction_jobs/);
    expect(migration).toMatch(/PRIMARY KEY REFERENCES interpretations\(id\) ON DELETE CASCADE/);
    expect(migration).toMatch(/lease_expires_at timestamptz NOT NULL DEFAULT \(now\(\) \+ interval '2 minutes'\)/);
    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION billing_claim_metadata_extraction/);
    expect(migration).toMatch(/FOR UPDATE/);
    expect(migration).toMatch(/WHERE interpretation_metadata_extraction_jobs\.status IN \('completed', 'failed'\)/);
    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION billing_finish_metadata_extraction/);
    expect(migration).toMatch(/ALTER TABLE interpretation_metadata_extraction_jobs ENABLE ROW LEVEL SECURITY/);

    expect(billingDb).toMatch(/export type MetadataExtractionClaim/);
    expect(billingDb).toMatch(/billing_claim_metadata_extraction/);
    expect(billingDb).toMatch(/billing_finish_metadata_extraction/);

    expect(gatewayReadme).toMatch(/server-side lease/);
    expect(gatewayReadme).toMatch(/duplicate OpenAI metadata calls/);
  });

  it('keeps streamed reflection typing append-aware with catch-up instead of restarting', () => {
    const dreamDetailScreen = readFileSync(path.join(repoRoot, 'src/screens/DreamDetailScreen.tsx'), 'utf8');
    const phasedTypingText = readFileSync(path.join(repoRoot, 'src/components/ui/PhasedTypingText.tsx'), 'utf8');
    const formatter = readFileSync(path.join(repoRoot, 'src/utils/formatInterpretationMarkdown.ts'), 'utf8');

    expect(dreamDetailScreen).toMatch(/\(isTyping \|\| isStreaming\) && !isUser/);
    expect(dreamDetailScreen).toMatch(/PhasedTypingText/);
    // Locked UX: never reintroduce the instant full-text stream shortcut without approval.
    expect(dreamDetailScreen).not.toMatch(
      /isStreaming && !isUser \?\s*\(\s*<FormattedMessageText/
    );
    expect(phasedTypingText).toMatch(/formatInterpretationMarkdown/);
    expect(phasedTypingText).toMatch(/const previousNormalized = normalizedTextRef\.current/);
    expect(phasedTypingText).toMatch(/const previousRaw = rawTextRef\.current/);
    expect(phasedTypingText).toMatch(/const isAppendOnlyUpdate = isNormalizedAppend \|\| isRawAppend/);
    expect(phasedTypingText).toMatch(/CATCH_UP_BEHIND_WORDS/);
    expect(phasedTypingText).toMatch(/WORD_DELAY_CATCH_UP_MS/);
    expect(phasedTypingText).toMatch(/Keep an already-running timer alive across append-only partial updates/);
    expect(phasedTypingText).toMatch(/setDisplayedWords\(tokens\.slice\(0, keepCount\)\)/);
    expect(phasedTypingText).toMatch(/wordIdxRef\.current = 0/);
    expect(formatter).toMatch(/Consecutive list items must each keep a bullet/);
    expect(formatter).toMatch(/return `• \$\{trimmed\.replace/);
  });
});
