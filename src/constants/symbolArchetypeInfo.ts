/**
 * Informational content for symbol & archetype section modals.
 * Shown when user taps the (?) icon next to section titles, or when tapping archetype chips.
 */
import { normalizeArchetype, type ArchetypeName } from './archetypes';

export const MODAL_FOOTER =
  'These reflections are not diagnoses or truths — they are invitations to explore.';

export const ARCHETYPE_SECTION_TITLES = {
  core: 'Inner structures',
  dynamic: 'Archetypal energies',
} as const;

export const ARCHETYPE_SECTION_NOTES = {
  core:
    'The deeper structures of the psyche. These are enduring functions like Ego, Shadow, or Persona that shape how experience gets organized.',
  dynamic:
    "Patterns that move through you for a time. They describe a living mood or current, not a fixed identity.",
} as const;

export const DREAM_LAYER_OVERVIEW = [
  'Dreams speak through three interwoven layers:',
  'Symbols — the vivid images and scenes that stand out.',
  'Inner structures — deeper psychic functions such as Ego, Shadow, Persona, Anima, or Animus.',
  'Archetypal energies — wider patterns or states of being that move through you temporarily.',
] as const;

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
  | 'archetype-animus'
  | 'archetype-great-mother'
  | 'archetype-father'
  | 'archetype-child'
  | 'archetype-hero'
  | 'archetype-trickster'
  | 'archetype-wise-old-man'
  | 'archetype-wise-old-woman'
  | 'archetype-maiden'
  | 'archetype-kore'
  | 'archetype-lover'
  | 'archetype-warrior'
  | 'archetype-king'
  | 'archetype-queen'
  | 'archetype-magician'
  | 'archetype-healer'
  | 'archetype-wounded-healer'
  | 'archetype-destroyer'
  | 'archetype-death'
  | 'archetype-rebirth';

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
    title: 'What are key symbols?',
    subtitle: 'More direct, more immediate',
    paragraphs: [
      'Symbols are the images, places, people or actions that stood out in your dream.',
      'They are not "codes" with fixed meanings, but living images that carry personal and emotional significance.',
      'A symbol may reflect:',
      'The same symbol can mean very different things for different people — or even for you, at different times.',
      'Here, we highlight the images carrying the strongest charge, so you can begin reflecting on them.',
    ],
    bullets: ['an inner state', 'a relationship', 'a memory or unresolved feeling'],
    bulletsAfterParagraph: 2,
  },
  'symbolic-motifs': {
    title: 'What are symbolic motifs?',
    subtitle: 'The form the dream takes',
    paragraphs: [
      'Motifs describe the FORM of the dream — how it is structured, not what it means.',
      'If symbols are the standout images, motifs are the recurring situations, pathways, or spatial shapes linking those images together.',
      'They are spatial or imaginal structures, movements in space, or recurring symbolic situations.',
      'Examples:',
      'These patterns often recur across dreams. They bridge concrete images and deeper psychic organization.',
    ],
    bullets: [
      'descending underground',
      'crowded marketplace',
      'watching from outside',
      'threshold crossing',
      'hidden backstage area',
    ],
    bulletsAfterParagraph: 2,
  },
  'core-architecture': {
    title: 'What are inner structures?',
    subtitle: 'The deeper structures shaping experience',
    paragraphs: [
      'Inner structures are not moods or temporary roles. They are the deeper functions through which the dream organizes experience.',
      'They shape how you experience yourself and the world, and dreams often show how they relate, split, or compensate for one another.',
      'Examples include:',
      'These structures are always present, but a dream may bring one into sharper focus than another.',
    ],
    bullets: [
      'Ego — your conscious sense of self',
      'Shadow — unintegrated intensity or charge that has not yet found relationship',
    ],
    bulletsAfterParagraph: 4,
  },
  'archetypal-states': {
    title: 'What are archetypal energies?',
    subtitle: 'Patterns that move through you',
    paragraphs: [
      'Archetypal energies are not your permanent structure. They are larger patterns of feeling, stance, or momentum that a dream shows moving through you.',
      'In dreams, they rarely appear as labels. They show up as states, moods, figures, or dynamics that temporarily take hold.',
      'Examples:',
      'These patterns are not who you are. They are ways of being you may be moving through, resisting, or being asked to relate to.',
    ],
    bullets: ['Caregiver', 'Explorer', 'Protector', 'Trickster'],
    bulletsAfterParagraph: 4,
  },

  // Inner structures — individual archetype chips
  'archetype-self': {
    title: '🜂 Self',
    subtitle: 'Inner structures — structural',
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
    subtitle: 'Inner structures — structural',
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
    subtitle: 'Inner structures — structural',
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
    subtitle: 'Inner structures — structural',
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
    subtitle: 'Inner structures — structural',
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
    subtitle: 'Inner structures — structural',
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

  // Archetypal energies — individual archetype chips
  'archetype-great-mother': {
    title: '✶ Great Mother',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Great Mother is the field of holding, nourishment, and belonging. It is the psychic sense that life can contain you, feed you, and let you grow.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as shelters, kitchens, caves, oceans, fertile landscapes, or maternal figures who gather and protect. The mood is usually enveloping.',
      },
      {
        heading: 'Distortion',
        content:
          'When this energy tightens, holding can become engulfing: too much protection, too little space, difficulty breathing your own rhythm.',
      },
      {
        heading: 'Orienting question',
        content:
          'Where in your life do you need real nourishment — and where might care be turning into overcontainment?',
      },
    ],
  },
  'archetype-father': {
    title: '✶ Father',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Father names the principle of structure: boundary, law, orientation, and consequence. It gives form so energy can become direction.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as authority figures, institutions, clear rules, thresholds, or voices setting limits. This energy asks for posture and accountability.',
      },
      {
        heading: 'Distortion',
        content:
          'It can harden into rigidity, judgment, or fear of failure. In its absence, life may feel uncontained and diffuse.',
      },
      {
        heading: 'Orienting question',
        content:
          'What boundary here protects your growth — and what rule has become too narrow for who you are now?',
      },
    ],
  },
  'archetype-child': {
    title: '✶ Child',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Child carries beginning-energy: vulnerability, wonder, dependency, and future possibility. It points to what is still becoming.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as infants, young figures, first attempts, fragile tasks, or moments of innocence and spontaneous curiosity.',
      },
      {
        heading: 'Distortion',
        content:
          'This energy can collapse into helplessness, or swing into entitlement that avoids responsibility for growth.',
      },
      {
        heading: 'Orienting question',
        content:
          'What tender new life in you needs protection and patience — not pressure to be fully formed already?',
      },
    ],
  },
  'archetype-hero': {
    title: '✶ Hero',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Hero is the force that mobilises against inertia. It gathers courage, will, and effort to cross a threshold or face a challenge.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as quests, battles, rescues, ascents, tests, and situations where you must act despite fear.',
      },
      {
        heading: 'Distortion',
        content:
          'Hero-energy can overidentify with conquest: constant proving, exhaustion, and difficulty admitting limits or needing help.',
      },
      {
        heading: 'Orienting question',
        content:
          'What are you truly fighting for here — and what might become possible if effort included support?',
      },
    ],
  },
  'archetype-trickster': {
    title: '✶ Trickster',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Trickster is disruptive intelligence. It unsettles fixed patterns, exposes pretence, and reintroduces movement where things have become dead or overcontrolled.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as reversals, jokes, slips, shapeshifting figures, absurd timing, or sudden rule-breaking that changes the whole mood.',
      },
      {
        heading: 'Distortion',
        content:
          'Without relationship, this energy can become cynical sabotage: cleverness that avoids commitment, intimacy, or consequence.',
      },
      {
        heading: 'Orienting question',
        content:
          'What false certainty is being interrupted — and what living truth is trying to break through the disruption?',
      },
    ],
  },
  'archetype-wise-old-man': {
    title: '✶ Wise Old Man',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Wise Old Man is an image of orienting insight: discernment, perspective, and guidance that can name a path through confusion.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as mentors, teachers, hermits, maps, keys, or concise phrases that suddenly make chaos legible.',
      },
      {
        heading: 'Distortion',
        content:
          'Guidance can become detached certainty: advice without felt contact, doctrine without relationship, intellect without body.',
      },
      {
        heading: 'Orienting question',
        content:
          'Does this guidance help you inhabit your life more fully — or does it tempt you to stand outside of it?',
      },
    ],
  },
  'archetype-wise-old-woman': {
    title: '✶ Wise Old Woman',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Wise Old Woman carries embodied wisdom: timing, intuition, and lived knowing born through cycles, loss, and continuity.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as elder female figures, healers, weavers, midwives, or steady presences who know when to wait and when to move.',
      },
      {
        heading: 'Distortion',
        content:
          'This energy can harden into fatalism or covert control if wisdom stops listening to what is newly emerging.',
      },
      {
        heading: 'Orienting question',
        content:
          'What rhythm is asking for your trust now — and where are you rushing past what needs ripening?',
      },
    ],
  },
  'archetype-maiden': {
    title: '✶ Maiden',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Maiden marks threshold innocence: awakening desire, freshness of perception, and the first shimmer of possibility.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as springlike atmospheres, first meetings, open roads, youthful figures, or scenes charged with anticipation.',
      },
      {
        heading: 'Distortion',
        content:
          'It may drift into idealisation, perfectionism, or endless waiting for life to begin under flawless conditions.',
      },
      {
        heading: 'Orienting question',
        content:
          'What wants to begin now, imperfectly and alive, if you stop postponing it for a "perfect moment"?',
      },
    ],
  },
  'archetype-kore': {
    title: '✶ Kore',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'Kore is the daughter at the threshold of descent: innocence meeting forces it did not choose. It speaks to initiation through rupture.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as young feminine figures drawn downward, split worlds, abduction motifs, seasonal shifts, or underworld passages.',
      },
      {
        heading: 'Distortion',
        content:
          'This energy can freeze into passivity or dissociation when descent is endured but not integrated as lived knowledge.',
      },
      {
        heading: 'Orienting question',
        content:
          'Where are you being asked to reclaim agency after a descent you did not choose?',
      },
    ],
  },
  'archetype-lover': {
    title: '✶ Lover',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Lover is the energy of connection, eros, and devotion. It binds attention to what matters through feeling, beauty, and longing.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as embrace, attraction, tenderness, sensual detail, shared breath, or intense emotional attunement.',
      },
      {
        heading: 'Distortion',
        content:
          'When ungrounded, longing becomes fusion or possession, and desire can lose contact with boundaries and reality.',
      },
      {
        heading: 'Orienting question',
        content:
          'Where is this longing inviting true relation — and where is it asking to own what cannot be owned?',
      },
    ],
  },
  'archetype-warrior': {
    title: '✶ Warrior',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Warrior brings disciplined force: focus, boundary, stamina, and readiness to protect what is vital.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as armour, weapons, training, patrol, confrontation, or strategic movement under pressure.',
      },
      {
        heading: 'Distortion',
        content:
          'It can become chronic combat mode: hardness, hypervigilance, and inability to stand down once danger has passed.',
      },
      {
        heading: 'Orienting question',
        content:
          'What truly needs defending here — and what can soften now that protection is in place?',
      },
    ],
  },
  'archetype-king': {
    title: '✶ King',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The King symbolises ordering authority in mature form: stewardship, responsibility, and the capacity to create stable centre.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as thrones, councils, legal halls, central chambers, or figures who set order and allocate roles.',
      },
      {
        heading: 'Distortion',
        content:
          'In shadow form it tilts toward tyranny, entitlement, or stagnation — power preserving itself instead of serving life.',
      },
      {
        heading: 'Orienting question',
        content:
          'What domain of your life asks for sober stewardship rather than control, avoidance, or performance?',
      },
    ],
  },
  'archetype-queen': {
    title: '✶ Queen',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Queen carries relational sovereignty: dignified authority that tends bonds, atmosphere, and the quality of a shared field.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as regal feminine figures, courts, homes under clear care, symbolic garments, or scenes where value and order are set.',
      },
      {
        heading: 'Distortion',
        content:
          'This energy can slide into emotional control, superiority, or martyr-care that manages everyone while hiding personal need.',
      },
      {
        heading: 'Orienting question',
        content:
          'How can your authority hold relationship and truth at once, without collapsing into control?',
      },
    ],
  },
  'archetype-magician': {
    title: '✶ Magician',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Magician is transformational intelligence: the ability to shift states through attention, symbolic process, and precise intervention.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as rituals, alchemical spaces, coded objects, hidden mechanisms, or figures who alter reality through subtle acts.',
      },
      {
        heading: 'Distortion',
        content:
          'Its shadow is manipulation: controlling outcomes from distance, treating life as technique, and avoiding vulnerable participation.',
      },
      {
        heading: 'Orienting question',
        content:
          'What here wants true transformation through practice — not a shortcut that bypasses honest contact?',
      },
    ],
  },
  'archetype-healer': {
    title: '✶ Healer',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Healer is the capacity to restore flow after wounding. It brings attunement, care, and repair without needing dramatic control.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as medicine spaces, cleansing water, soothing touch, plants, careful listening, or rituals of mending.',
      },
      {
        heading: 'Distortion',
        content:
          'Healing can become rescuing: overfunctioning for others while neglecting limits, reciprocity, and one’s own restoration.',
      },
      {
        heading: 'Orienting question',
        content:
          'What needs tending with patience right now — and what are you trying to "fix" too quickly?',
      },
    ],
  },
  'archetype-wounded-healer': {
    title: '✶ Wounded Healer',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Wounded Healer is healing authority shaped by lived pain. The wound does not disappear; it becomes depth, humility, and discernment.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as injured guides, scarred teachers, caretakers in recovery, or scenes where vulnerability and service coexist.',
      },
      {
        heading: 'Distortion',
        content:
          'It can overidentify with hurt, or overgive to avoid facing one’s own unresolved grief and limits.',
      },
      {
        heading: 'Orienting question',
        content:
          'How can this wound become a source of grounded wisdom without becoming your only identity?',
      },
    ],
  },
  'archetype-destroyer': {
    title: '✶ Destroyer',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'The Destroyer is the force that breaks what can no longer live. It clears false structures so something more truthful can emerge.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as fire, demolition, storms, collapsing architecture, tearing, severing, or decisive acts of ending.',
      },
      {
        heading: 'Distortion',
        content:
          'Without relation, this energy becomes scorched-earth reactivity: destruction for discharge rather than transformation.',
      },
      {
        heading: 'Orienting question',
        content:
          'What exactly needs to end here — and what deserves protection while the old form is dismantled?',
      },
    ],
  },
  'archetype-death': {
    title: '✶ Death',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'Death marks irreversible ending and release. In dream language, it most often signals symbolic completion rather than literal prediction.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as funerals, graves, bones, silent rooms, dark thresholds, last breaths, or scenes where an old identity cannot continue.',
      },
      {
        heading: 'Distortion',
        content:
          'Fear can freeze this process into clinging: trying to preserve a form that has already finished its cycle.',
      },
      {
        heading: 'Orienting question',
        content:
          'What chapter has already ended, even if part of you is still negotiating with it?',
      },
    ],
  },
  'archetype-rebirth': {
    title: '✶ Rebirth',
    subtitle: 'Archetypal energies — dynamic',
    sections: [
      {
        heading: 'What it is',
        content:
          'Rebirth is renewal after true ending. It is not reset-by-will, but reorganisation that follows loss, metabolisation, and changed orientation.',
      },
      {
        heading: 'How it appears in dreams',
        content:
          'Often as dawn light, infants, green shoots, emergence from water, repaired landscapes, or first breath after constriction.',
      },
      {
        heading: 'Distortion',
        content:
          'Its shadow is spiritual bypass: rushing to a "new me" while grief, accountability, or integration remain unfinished.',
      },
      {
        heading: 'Orienting question',
        content:
          'What new form is asking to be lived slowly and concretely, not just imagined?',
      },
    ],
  },
};

const ARCHETYPE_INFO_KEY_MAP: Record<ArchetypeName, InfoModalKey> = {
  Self: 'archetype-self',
  Ego: 'archetype-ego',
  Shadow: 'archetype-shadow',
  Persona: 'archetype-persona',
  Anima: 'archetype-anima',
  Animus: 'archetype-animus',
  'Great Mother': 'archetype-great-mother',
  Father: 'archetype-father',
  Child: 'archetype-child',
  Hero: 'archetype-hero',
  Trickster: 'archetype-trickster',
  'Wise Old Man': 'archetype-wise-old-man',
  'Wise Old Woman': 'archetype-wise-old-woman',
  Maiden: 'archetype-maiden',
  Kore: 'archetype-kore',
  Lover: 'archetype-lover',
  Warrior: 'archetype-warrior',
  King: 'archetype-king',
  Queen: 'archetype-queen',
  Magician: 'archetype-magician',
  Healer: 'archetype-healer',
  'Wounded Healer': 'archetype-wounded-healer',
  Destroyer: 'archetype-destroyer',
  Death: 'archetype-death',
  Rebirth: 'archetype-rebirth',
};

/** Map archetype name to dedicated modal content key, falling back to generic energies modal. */
export function getArchetypeInfoKey(archetypeName: string): InfoModalKey {
  const normalized = normalizeArchetype(archetypeName);
  if (!normalized) return 'archetypal-states';
  return ARCHETYPE_INFO_KEY_MAP[normalized] ?? 'archetypal-states';
}
