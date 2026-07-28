/**
 * Edge re-export of structured AI Zod validation (Deno resolves `zod` via import_map).
 */
export {
  STRUCTURED_AI_TASKS,
  DREAM_EXTRACTION_SOFT_DEFAULTS,
  normalizeMainTensionAgainstCentralConflicts,
  isStructuredAiTask,
  parseStructuredJsonObject,
  validateStructuredTaskContent,
  buildStructuredRepairMessages,
  safeStructuredValidationLog,
  safeAssistantJsonDiagnostics,
  dreamExtractionSchema,
  archetypeAdjudicationSchema,
  conversationElementUpdateSchema,
  semanticGroupingSchema,
  type StructuredAiTask,
  type StructuredValidationLog,
  type StructuredValidationResult,
} from '../../../src/ai/structuredTaskValidation.ts';
