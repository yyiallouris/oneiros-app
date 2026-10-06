export type GenerativeSafetyBlockReason =
  | 'sexual_content_involving_minors'
  | 'harmful_instructions'
  | 'explicit_sexual_generation';

export const AI_SAFETY_BLOCK_MESSAGE =
  "This request can’t be sent to the AI. Oneiros can’t generate instructions or material that could facilitate harm, exploitation, or illegal activity. If this is about immediate safety, contact local emergency services or a trusted medical or mental health professional now.";

/**
 * Narrow guard for the free-form follow-up surface. Dream narratives are not
 * screened by keywords: difficult dream material must remain recordable.
 * Provider safety controls remain the broader model-output boundary.
 */
export function getGenerativeSafetyBlockReason(input: string): GenerativeSafetyBlockReason | null {
  const normalized = input.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized) return null;

  const minorTerms = /\b(child|children|minor|underage|kid|preteen|teenager)\b|παιδ|ανήλικ/iu;
  const sexualTerms = /\b(porn|pornographic|sexual|sexually|nude|naked|explicit)\b|πορνο|σεξουαλ|γυμν/iu;
  if (minorTerms.test(normalized) && sexualTerms.test(normalized)) {
    return 'sexual_content_involving_minors';
  }

  const asksForInstructions = /\b(how (?:can|do|to)|instructions? (?:for|to)|step[- ]by[- ]step|teach me (?:how|to)|best way to)\b|πώς να|οδηγίες (?:για|να)/iu;
  const harmfulTarget = /\b(kill (?:myself|someone|people)|suicide|make (?:a )?bomb|build (?:a )?bomb|weapon|poison someone|malware|ransomware|hack (?:an? |someone|a ))\b|αυτοκτον|σκοτώ|βόμβ|όπλ|κακόβουλο λογισμικό/iu;
  if (asksForInstructions.test(normalized) && harmfulTarget.test(normalized)) {
    return 'harmful_instructions';
  }

  const asksToGenerate = /\b(write|generate|create|make|roleplay)\b|γράψε|δημιούργησε/iu;
  const explicitSexualContent = /\b(porn|pornographic|explicit sex|sexual roleplay)\b|πορνογραφ|ρητ(?:ό|η) σεξουαλ/iu;
  if (asksToGenerate.test(normalized) && explicitSexualContent.test(normalized)) {
    return 'explicit_sexual_generation';
  }

  return null;
}

export function assertPermittedGenerativeRequest(input: string): void {
  const reason = getGenerativeSafetyBlockReason(input);
  if (!reason) return;
  const error = new Error(AI_SAFETY_BLOCK_MESSAGE) as Error & { code?: string; reason?: string };
  error.name = 'GenerativeSafetyError';
  error.code = 'ai_safety_blocked';
  error.reason = reason;
  throw error;
}
