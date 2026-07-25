/**
 * Edge re-export of structured AI Zod validation (Deno resolves `zod` via import_map).
 */
export {
  STRUCTURED_AI_TASKS,
  isStructuredAiTask,
  parseStructuredJsonObject,
  validateStructuredTaskContent,
  buildStructuredRepairMessages,
  safeStructuredValidationLog,
  safeAssistantJsonDiagnostics,
  dreamExtractionSchema,
  conversationElementUpdateSchema,
  semanticGroupingSchema,
  type StructuredAiTask,
  type StructuredValidationLog,
  type StructuredValidationResult,
} from '../../../src/ai/structuredTaskValidation.ts';
