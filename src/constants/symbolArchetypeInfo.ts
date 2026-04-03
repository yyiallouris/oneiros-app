/**
 * Informational content for symbol & archetype section modals.
 * Shown when user taps the (?) icon next to section titles, or when tapping archetype chips.
 */

export const MODAL_FOOTER =
  'These reflections are not diagnoses or truths — they are invitations to explore.';

export type InfoModalKey =
  | 'main-symbols'
  | 'symbolic-motifs'
  | 'core-architecture'
  | 'archetypal-states'
  | 'archetype-self'
  | 'archetype-ego'
  | 'archetype-shadow'
  | 'archetype-persona'
  | 'archetype-anima'
  | 'archetype-animus';

export interface InfoModalContent {
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  /** Bullets to show after paragraph at this index (0-based). */
  bullets?: string[];
  bulletsAfterParagraph?: number;
  /** For archetype chips: structured sections with headings. */
  sections?: Array<{ heading: string; content: string }>;
}

export const SYMBOL_ARCHETYPE_INFO: Record<InfoModalKey, InfoModalContent> = {
  'main-symbols': {
    title: 'What are symbols?',
    subtitle: 'More direct, more immediate',
    paragraphs: [
      'Symbols are the images, places, people or actions that stood out in your dream.',
      'They are not "codes" with fixed meanings, but living images that carry personal and emotional significance.',
      'A symbol may reflect:',
      'The same symbol can mean very different things for different people — or even for you, at different times.',
      'Here, we highlight what appeared most strongly, so you can begin reflecting on it.',
    ],
    bullets: ['an inner state', 'a relationship', 'a memory or unresolved feeling'],
    bulletsAfterParagraph: 2,
  },
  'symbolic-motifs': {
    title: 'What are symbolic motifs?',
    subtitle: 'The form the dream takes',
    paragraphs: [
      'Motifs describe the FORM of the dream — how it is structured, not what it means.',
      'They are spatial or imaginal structures, movements in space, or recurring symbolic situations.',
      'Examples:',
      'These patterns often recur across dreams. They bridge concrete images and archetypal dynamics.',
    ],
    bullets: ['descending underground', 'crowded marketplace', 'watching from outside', 'threshold crossing', 'hidden backstage area'],
    bulletsAfterParagraph: 2,
  },
  'core-architecture': {
    title: 'What is core architecture?',
    subtitle: 'Deeper, but grounded',
    paragraphs: [
      'This refers to the deeper inner structures through which the dream organizes experience.',
      'Not roles or personalities — but deeper inner functions that shape how you experience yourself and the world.',
      'Examples include:',
      'These elements are always present, but dreams often reveal how they interact — and where tension or growth may be happening.',
    ],
    bullets: [
      'Ego — your conscious sense of self',
      'Shadow — parts of you that are hidden, rejected, or not yet integrated',
    ],
    bulletsAfterParagraph: 2,
  },
  'archetypal-states': {
    title: 'What are archetypal states?',
    subtitle: 'More experiential, more alive',
    paragraphs: [
      'Archetypes are universal patterns of human experience — ways of being that appear across cultures, myths, and inner life.',
      'In dreams, archetypes don\'t show up as labels. They appear as states, moods, or dynamics you temporarily inhabit.',
      'Examples:',
      'These are not who you are, but energies you are moving through — or being asked to relate to. Dreams often show how these patterns support you, conflict, or seek expression.',
    ],
    bullets: ['Caregiver', 'Explorer', 'Protector', 'Trickster'],
    bulletsAfterParagraph: 2,
  },

  // Core architecture — individual archetype chips
  'archetype-self': {
    title: '🜂 Self',
    subtitle: 'Core architecture — structural',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Self is the organising centre of the psyche. It is not a "higher self" or a goal to achieve. It is the principle of coherence that holds psychic parts in relation to one another. It does not act. It organises.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'The Self shows up when an organising centre is present and the dream as a whole moves toward coherence — even if the centre initially intensifies affect. It can be soothing or a destabilising reorganiser. Circles, centres, radiant points, or presences that hold the dream together.',
      },
      {
        heading: 'Important distinction',
        content:
          'If a central image creates agitation plus loss of coherence (wobble, disorientation, giving-way ground), it is not the Self. It is a contested or unstable centre.',
      },
      {
        heading: 'Orienting question',
        content:
          'When you return to this image, does it bring grounding and coherence — or tension and imbalance?',
      },
    ],
  },
  'archetype-ego': {
    title: '🜃 Ego',
    subtitle: 'Core architecture — structural',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Ego is the centre of conscious experience. It is the function that says: "I am here, and this is happening to me." It is not arrogance. It is orientation.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'The Ego appears through: how you move, what you approach or avoid, where you position yourself in relation to events. The Ego is rarely a figure — it is a stance.',
      },
      {
        heading: 'What it regulates',
        content:
          'It regulates: boundaries, pacing, engagement vs withdrawal. Not always optimally, but always with survival in mind.',
      },
      {
        heading: 'Orienting question',
        content:
          'In the dream, how does the Ego hold its position — approaching, freezing, or retreating?',
      },
    ],
  },
  'archetype-shadow': {
    title: '🜄 Shadow',
    subtitle: 'Core architecture — structural',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Shadow is not a "dark side." It is unmetabolised intensity — energy, impulse, or potential that has not yet found relationship with the Ego. It is not bad. It is unintegrated.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as: charged or unsettling figures, threat without clear reason, power that watches, waits, or approaches. The Shadow does not ask to be destroyed — it asks to be acknowledged.',
      },
      {
        heading: 'Common misunderstanding',
        content:
          'The Shadow does not mean "this is who you are." It means "this has not yet been related to."',
      },
      {
        heading: 'Orienting question',
        content:
          'When this image appears, what kind of intensity remains unclaimed or unassimilated?',
      },
    ],
  },
  'archetype-persona': {
    title: '🜁 Persona',
    subtitle: 'Core architecture — structural',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Persona is the interface between you and the social world. It is how you present yourself, function, and remain intelligible to others. It is not fake — it is functional.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often through: social or professional settings, attention to appearance, order, or correctness, adapting to group rhythm or expectations. The Persona keeps life running smoothly.',
      },
      {
        heading: 'The cost',
        content:
          'When it dominates, something more vital remains beneath the surface.',
      },
      {
        heading: 'Orienting question',
        content:
          'In the dream, what does the Persona preserve — and what is kept hidden to maintain order?',
      },
    ],
  },
  'archetype-anima': {
    title: '🜅 Anima',
    subtitle: 'Core architecture — structural',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Anima is the function of inner relatedness. It mediates emotion, imagination, sensitivity, and depth. It is not a "feminine side." It is a bridge to inner otherness.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as: female figures, emotionally charged images, experiences of attraction, awe, vulnerability, or longing. The Anima does not explain — it invites.',
      },
      {
        heading: 'Risk',
        content: 'It can be idealised or overloaded with meaning.',
      },
      {
        heading: 'Orienting question',
        content:
          'When this figure appears, does it draw you into lived feeling — or pull you into fantasy?',
      },
    ],
  },
  'archetype-animus': {
    title: '🜆 Animus',
    subtitle: 'Core architecture — structural',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Animus is the function of position, judgment, and meaning-making. It shapes opinions, direction, and inner authority. It is not "masculine energy." It is an inner principle of stance.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as: voices that judge or declare truth, authoritative male figures, logic overriding feeling. The Animus gives form — but can become rigid.',
      },
      {
        heading: 'Risk',
        content: 'When absolute, it breaks relationship.',
      },
      {
        heading: 'Orienting question',
        content:
          'In the dream, does the Animus clarify — or impose?',
      },
    ],
  },
};

/** Map archetype name to modal content key. Core archetypes have dedicated content; dynamic ones use generic archetypal-states. */
export function getArchetypeInfoKey(archetypeName: string): InfoModalKey {
  const lower = archetypeName.trim().toLowerCase();
  const coreMap: Record<string, InfoModalKey> = {
    self: 'archetype-self',
    ego: 'archetype-ego',
    shadow: 'archetype-shadow',
    persona: 'archetype-persona',
    anima: 'archetype-anima',
    animus: 'archetype-animus',
  };
  return coreMap[lower] ?? 'archetypal-states';
}
