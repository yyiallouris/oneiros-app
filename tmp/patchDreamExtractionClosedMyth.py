from pathlib import Path

path = Path('src/ai/dreamExtractionPrompt.ts')
text = path.read_text()

text = text.replace(
    "import { formatArchetypeCatalogForPromptV1 } from './catalogs/archetypeCatalog.v1.ts';\n",
    "import { formatArchetypeCatalogForPromptV1 } from './catalogs/archetypeCatalog.v1.ts';\n"
    "import {\n"
    "  MYTHIC_CATALOG_VERSION,\n"
    "  MYTHIC_PROMPT_INDEX,\n"
    "} from './catalogs/mythicPromptIndex.ts';\n",
    1,
)

text = text.replace(
    " * Interpretive Echoes (v4.0.0): minimal contrastive single-call selection.\n"
    " * Spec: docs/ONEIROS_INTERPRETIVE_ECHOES_V4_0_0.md\n",
    " * Interpretive Echoes (v4.1.0): v4 archetypes + closed Mythic catalog selection.\n"
    " * Specs: docs/ONEIROS_INTERPRETIVE_ECHOES_V4_0_0.md,\n"
    " *         docs/ONEIROS_CLOSED_MYTH_CATALOG_INTEGRATION_BRIEF.md\n",
)

start = text.index('\nMYTHIC ECHO\n')
end = text.index('\nSchema contract:')
new_mid = r'''

MYTHIC ECHO — CLOSED CATALOG

Select 0–1 mythic narrative.

Use the RAW DREAM only for selection and evidence.
Treat the reflection as absent until selection, confidence, and evidence are fixed.

You may select only a catalog id supplied inside CLOSED_MYTH_CATALOG.
Never invent or rewrite an ID.
Never output a myth title, tradition, source, generic motif, or free-text candidate.

First derive the dream's own:
- distinctive linked configuration
- ordered causal sequence
- functional relational roles
- defining conflict, bargain, prohibition, test, deception, recognition,
  sacrifice, reversal, or transformation
- ending

Then compare catalog records in this order:

1. defining cluster
2. ordered narrative sequence
3. relational roles
4. central conflict
5. transformation or ending
6. general theme

A candidate qualifies only when:

- at least three substantial dimensions match
- narrative_sequence or relational_roles is one of the substantial matches
- its defining configuration remains recognizable
- no supplied disqualifier describes the dream's actual configuration
- divergence modifies a real match rather than excusing missing core structure
- evidence comes only from the raw dream

Return [] when no supplied record qualifies.
A false Mythic Echo is worse than no result.
Do not select from a single object, creature, atmosphere, setting, or broad theme.
Do not infer cultural belonging from the dreamer's language or location.

The reflection may help only with localized resonance and divergence
wording after catalog_id, confidence, evaluation, and evidence are final.

A myth name, cultural parallel, or symbolic claim appearing only in the
reflection must be ignored for selection.

<CLOSED_MYTH_CATALOG version="${MYTHIC_CATALOG_VERSION}">
${MYTHIC_PROMPT_INDEX}
</CLOSED_MYTH_CATALOG>

CONTRASTIVE EXAMPLES

Example A — decisive cunning and exact tale

Dream pattern:
A weaker person releases a powerful being from a sealed vessel.
The being threatens the liberator.
The person feigns disbelief, challenges it to prove it can fit inside,
then closes the vessel and turns threat into negotiation.
A separate animal later guides the person through a real descent.

Correct:
- Trickster: the dream-ego's cunning reversal
- Guide / Psychopomp: the animal's active threshold guidance
- Mythic Echo: only a CLOSED_MYTH_CATALOG id whose sequence and roles match,
  otherwise amplifications: []

Incorrect:
- Hero merely because the dreamer acts bravely
- Wise Old Woman merely because an older woman warned once
- inventing or translating a myth title
- Aladdin / Fisher King / Gyges / "Jinn in the Bottle" free-text titles
- any title or tradition string outside CLOSED_MYTH_CATALOG ids

Example B — personal conflict without earned echo

Dream pattern:
A father shouts privately, then acts sweetly in front of relatives.
The dreamer feels anger but cannot express it.

Correct:
- archetypes: []
- amplifications: []

Do not force Shadow, Persona, Ruler, or a myth merely because the conflict is intense.

Example C — appearance is not function

Dream pattern:
An old man gives an incorrect timetable and leaves.
No real crossing occurs and his advice changes nothing.

Correct:
- archetypes: []
- amplifications: []

Do not select Wise Old Man or Guide / Psychopomp from age or advice alone.

OUTPUT

Archetype object:
{
  "canonical_label": "exact selectable catalog label",
  "expression": "concrete dream carrier",
  "resonance": "one sentence, 18–32 words, maximum 40",
  "evidence": ["1–2 faithful raw-dream details"],
  "confidence": "high" | "medium"
}

Mythic object (model-facing; never include title/tradition/source_type):
{
  "catalog_id": "exact id from CLOSED_MYTH_CATALOG",
  "resonance": "one concise sentence naming the shared sequence and roles",
  "divergence": "one concise sentence naming how the dream changes the tale",
  "evidence": ["2–3 faithful raw-dream details from different stages"],
  "confidence": "high" | "medium",
  "evaluation": {
    "matched_dimensions": ["distinctive_cluster", "narrative_sequence", "relational_roles"],
    "divergence_type": "outcome_changed" | "emphasis_changed" | "pattern_interrupted" | "pattern_unfinished" | "core_structure_absent",
    "disqualifiers_triggered": []
  }
}

Use the dream's primary language for expression, resonance, divergence, and evidence.
Do not invent catalog ids. Do not output title or tradition.
Do not say the dream reenacts, proves, or means the myth.
'''
text = text[:start] + new_mid + text[end:]

text = text.replace(
    '"amplifications": {"title": string, "tradition": string, "resonance": string, "divergence": string, "evidence": string[], "confidence": "high" | "medium"}[]',
    '"amplifications": {"catalog_id": string, "resonance": string, "divergence": string, "evidence": string[], "confidence": "high" | "medium", "evaluation": object}[]',
)

text = text.replace(
    'If nothing fits an array field, use []. Ordinary brief dreams may keep amplifications: [] and archetypes: []. For Mythic Echo, silence is preferable to false cultural authority, but an unusually direct structural match should be returned. If core_mode cannot be chosen without distortion, use null. Return only the JSON object with no markdown fences or commentary.',
    'If nothing fits an array field, use []. Ordinary brief dreams may keep amplifications: [] and archetypes: []. For Mythic Echo, return only a CLOSED_MYTH_CATALOG id or []. Silence is preferable to a forced id. If core_mode cannot be chosen without distortion, use null. Return only the JSON object with no markdown fences or commentary.',
)

text = text.replace(
    'For Interpretive Echoes, use the raw dream only for selection and evidence.\n'
    'Treat the reflection as absent until labels and myth title/tradition are fixed.\n'
    'Apply the contrastive examples and return 0–2 exact catalog archetypes and\n'
    '0–1 exact recognized narrative, or [] when not earned.\n'
    'Do not write a new interpretation.',
    'For Interpretive Echoes, use the raw dream only for selection and evidence.\n'
    'Treat the reflection as absent until archetype labels and myth catalog_id are fixed.\n'
    'Apply the contrastive examples and return 0–2 exact archetype catalog labels and\n'
    '0–1 CLOSED_MYTH_CATALOG id (never a free-text title), or [] when not earned.\n'
    'Do not write a new interpretation.',
)

text = text.replace(
    "export const DREAM_EXTRACTION_PROMPT_ID = 'dream-field-map-interpretive-v4.0';",
    "export const DREAM_EXTRACTION_PROMPT_ID = 'dream-field-map-interpretive-v4.1';",
)
text = text.replace(
    "export const DREAM_EXTRACTION_PROMPT_VERSION = '4.0.0';",
    "export const DREAM_EXTRACTION_PROMPT_VERSION = '4.1.0';",
)
text = text.replace(
    '"mythic_reason": "why the selected title was earned, or why []"',
    '"mythic_reason": "why the selected catalog_id was earned, or why []"',
)

path.write_text(text)
assert 'MYTHIC ECHO — CLOSED CATALOG' in text
assert '${MYTHIC_PROMPT_INDEX}' in text
assert 'Return one myth only when a SPECIFIC' not in text
assert "PROMPT_VERSION = '4.1.0'" in text
print('patched ok')
