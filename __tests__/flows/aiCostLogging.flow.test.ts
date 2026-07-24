/**
 * Flow coverage: documentation/architecture-interpretation.md and flows-10-subscriptions-billing.md
 * (safe AI token-cost logging for reflection + metadata extraction).
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

describe('AI cost logging flow', () => {
  it('estimates gateway AI costs from provider usage tokens and OpenAI pricing', () => {
    const billingAi = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts'), 'utf8');

    expect(billingAi).toMatch(/OPENAI_STANDARD_PRICING_SOURCE = 'openai_standard_short_context_2026_07_24'/);
    expect(billingAi).toMatch(/https:\/\/developers\.openai\.com\/api\/docs\/pricing/);
    expect(billingAi).toMatch(/'gpt-5\.4': \{ inputUsdPer1m: 2\.5, cachedInputUsdPer1m: 0\.25, outputUsdPer1m: 15 \}/);
    expect(billingAi).toMatch(/'gpt-5\.4-mini': \{ inputUsdPer1m: 0\.75, cachedInputUsdPer1m: 0\.075, outputUsdPer1m: 4\.5 \}/);
    expect(billingAi).toMatch(/usage\.prompt_tokens/);
    expect(billingAi).toMatch(/usage\.completion_tokens/);
    expect(billingAi).toMatch(/promptDetails\.cached_tokens/);
    expect(billingAi).toMatch(/billableInputTokens/);
    expect(billingAi).toMatch(/estimatedUsd/);
    expect(billingAi).toMatch(/Object\.defineProperty\(payload, AI_COST_FIELD/);
    expect(billingAi).toMatch(/generateDreamReflectionWithCost/);
    expect(billingAi).toMatch(/generateDreamExtractionWithCost/);
    expect(billingAi).toMatch(/invokeOpenAiProxyStream/);
    expect(billingAi).toMatch(/stream_options: \{ include_usage: true \}/);
    expect(billingAi).toMatch(/delta\.content/);
    expect(billingAi).toMatch(/failOnInvalidOrEmpty: true/);
    expect(billingAi).toMatch(/AI extraction returned invalid JSON/);
    expect(billingAi).toMatch(/AI extraction returned no usable metadata/);
  });

  it('propagates reflection and metadata costs through gateway responses and logs', () => {
    const gateway = readFileSync(path.join(repoRoot, 'supabase/functions/ai-entitlements-gateway/index.ts'), 'utf8');
    const service = readFileSync(path.join(repoRoot, 'src/services/entitledAiService.ts'), 'utf8');
    const dreamDetailScreen = readFileSync(path.join(repoRoot, 'src/screens/DreamDetailScreen.tsx'), 'utf8');

    expect(gateway).toMatch(/reflection_ai_cost/);
    expect(gateway).toMatch(/partial_reflection/);
    expect(gateway).toMatch(/patchQuotaEventResultContext/);
    expect(gateway).toMatch(/reflection_cost_usd/);
    expect(gateway).toMatch(/metadata_ai_cost/);
    expect(gateway).toMatch(/metadata_cost_usd/);
    expect(gateway).toMatch(/total_ai_cost_usd/);
    expect(gateway).toMatch(/reflection total ai cost/);
    expect(gateway).toMatch(/origin_quota_event_id/);
    expect(gateway).toMatch(/metadata_status: 'failed'/);
    expect(gateway).toMatch(/throw error instanceof HttpError/);

    expect(service).toMatch(/reflectionCostUsd/);
    expect(service).toMatch(/REFLECTION_PARTIAL_REVEAL_AFTER_MS = 15000/);
    expect(service).toMatch(/onPartialReflection/);
    expect(service).toMatch(/ensureDreamMetadataExtraction/);
    expect(service).toMatch(/metadataExtractionInFlight = new Map/);
    expect(service).toMatch(/metadataCostUsd/);
    expect(service).toMatch(/totalAiCostUsd/);

    expect(dreamDetailScreen).toMatch(/isStreaming\?: boolean/);
    expect(dreamDetailScreen).toMatch(/\(isTyping \|\| isStreaming\) && !isUser/);
    expect(dreamDetailScreen).toMatch(/!isTyping && !isStreaming/);
    expect(dreamDetailScreen).toMatch(/hadStreamingReflectionRef/);
    expect(dreamDetailScreen).toMatch(/shouldTypeFinalReflection = !hadStreamingReflectionRef\.current/);
    expect(dreamDetailScreen).toMatch(/ensureDreamMetadataExtraction\(nextInterpretation\.id\)\.then/);
    expect(dreamDetailScreen).toMatch(/Dream details are still forming/);
    expect(dreamDetailScreen).toMatch(/refreshInterpretationMetadata\(interpretation\.id\)/);
  });

  it('keeps streamed reflection typing append-aware instead of restarting on each partial', () => {
    const phasedTypingText = readFileSync(path.join(repoRoot, 'src/components/ui/PhasedTypingText.tsx'), 'utf8');

    expect(phasedTypingText).toMatch(/const previousText = normalizedTextRef\.current/);
    expect(phasedTypingText).toMatch(/const nextText = normalizeInterpretationForTyping\(text\)/);
    expect(phasedTypingText).toMatch(/const isAppendOnlyUpdate =/);
    expect(phasedTypingText).toMatch(/nextText\.startsWith\(previousText\)/);
    expect(phasedTypingText).toMatch(/if \(!isAppendOnlyUpdate\) \{/);
    expect(phasedTypingText).toMatch(/wordIdxRef\.current = 0/);
  });
});
