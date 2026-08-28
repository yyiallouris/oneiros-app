import type { OneirosLanguageCode } from '../../src/constants/oneirosLanguages';

export const REFLECTIVE_DIALOGUE_V1_BENCHMARK_ID =
  'oneiros-reflective-dialogue-v1-trajectories' as const;
export const REFLECTIVE_DIALOGUE_V1_BENCHMARK_VERSION = '2.1.0' as const;

export const REFLECTIVE_DIALOGUE_HUMAN_QUALITY_GATE = {
  status: 'pending_human_review',
  scoreScale: '0-2',
  dimensions: [
    'user_answer_uptake',
    'continuity',
    'image_near_depth',
    'psychic_expansion',
    'epistemic_restraint',
    'human_warmth',
    'genuine_desire_to_continue',
    'next_opening_quality',
    'answer_target_language_naturalness',
    'question_target_language_naturalness',
  ],
  judgment: 'next_question_preferable_to_abstain',
} as const;

export type ReflectiveDialogueV1Scenario = {
  id: string;
  responseType:
    | 'sensory_answer'
    | 'correction'
    | 'not_knowing'
    | 'waking_association'
    | 'meaning_request'
    | 'positive_coherence'
    | 'grief_response'
    | 'brief_completion'
    | 'language_switch'
    | 'ambiguous_short_reply';
  language: OneirosLanguageCode;
  expectedOutputLanguage?: OneirosLanguageCode;
  title: string;
  dream: string;
  priorReading: string;
  visibleQuestion: string;
  userReply: string;
  reviewerFocus: string;
};

/** Synthetic only: safe to inspect and deliberately unrelated to user data. */
export const REFLECTIVE_DIALOGUE_V1_SCENARIOS: ReflectiveDialogueV1Scenario[] = [
  {
    id: 'transparent-warm-hand',
    responseType: 'sensory_answer',
    language: 'el',
    title: 'Το διάφανο χέρι',
    dream:
      'Στην παραλία πήγα να πιάσω το χέρι ενός παιδιού. Το σώμα του ήταν διάφανο, αλλά στεκόταν πολύ κοντά μου.',
    priorReading:
      'Η εγγύτητα του παιδιού δεν αναιρεί τη διαφάνειά του· η επαφή μένει δυνατή αλλά αβέβαιη.',
    visibleQuestion:
      'Όταν πήγες να πιάσεις το χέρι του, τι συνέβη στο άγγιγμα;',
    userReply:
      'Το χέρι του ήταν ζεστό, αλλά περνούσε μέσα από το δικό μου.',
    reviewerFocus:
      'Does the answer develop warm contact without converting transparency into absence or loss?',
  },
  {
    id: 'calm-correction',
    responseType: 'correction',
    language: 'el',
    title: 'Το ανοιχτό παράθυρο',
    dream:
      'Καθόμουν δίπλα σε ένα ανοιχτό παράθυρο. Έξω φυσούσε δυνατά, αλλά οι κουρτίνες δεν κινούνταν.',
    priorReading:
      'Η ακινησία της κουρτίνας μοιάζει να κρατά μια ένταση απέναντι στον άνεμο.',
    visibleQuestion:
      'Πώς ήταν για σένα να βλέπεις την κουρτίνα να μένει ακίνητη μέσα στον άνεμο;',
    userReply:
      'Δεν υπήρχε καθόλου ένταση. Ένιωθα απόλυτα ήρεμος και προστατευμένος.',
    reviewerFocus:
      'Does the reply genuinely revise the earlier tension frame instead of defending it?',
  },
  {
    id: 'ordinary-not-knowing',
    responseType: 'not_knowing',
    language: 'el',
    title: 'Το φως του ψυγείου',
    dream:
      'Άνοιξα το ψυγείο, κοίταξα ένα λεμόνι και το έκλεισα. Μετά κάθισα πάλι στο τραπέζι.',
    priorReading:
      'Η μικρή διακοπή αφήνει το λεμόνι φωτισμένο για μια στιγμή και μετά επιστρέφει στην καθημερινότητα.',
    visibleQuestion:
      'Όταν γύρισες στο τραπέζι, τι είχε αλλάξει από εκείνο το σύντομο φως;',
    userReply: 'Δεν ξέρω. Νομίζω τίποτα.',
    reviewerFocus:
      'Does the reply respect ordinariness and uncertainty without manufacturing symbolic importance?',
  },
  {
    id: 'user-led-life-bridge',
    responseType: 'waking_association',
    language: 'el',
    title: 'Το κόκκινο κασκόλ',
    dream:
      'Σε ένα ήσυχο λιμάνι μια γυναίκα ξετύλιγε αργά ένα κόκκινο κασκόλ. Πριν τελειώσει, ακούστηκε χτύπημα στην πόρτα.',
    priorReading:
      'Το αργό ξετύλιγμα δημιουργεί μια οικειότητα που διακόπτεται πριν φανεί ολόκληρη.',
    visibleQuestion:
      'Τι γινόταν ανάμεσά σας όσο εκείνη ξετύλιγε το κασκόλ;',
    userReply:
      'Μου θυμίζει μια σχέση όπου περίμενα πάντα να ανοιχτεί ο άλλος, αλλά ερχόταν κάτι και μας διέκοπτε.',
    reviewerFocus:
      'Does the reply accept the user-led waking bridge without turning one association into diagnosis?',
  },
  {
    id: 'direct-meaning-request',
    responseType: 'meaning_request',
    language: 'el',
    title: 'Το δέρμα από φλοιό',
    dream:
      'Στον λόφο το δέρμα στα χέρια μου έγινε φλοιός. Δεν πονούσα και συνέχισα να κοιτάζω την κοιλάδα.',
    priorReading:
      'Η μεταμόρφωση δεν έρχεται ως τραυματισμός αλλά ως νέος τρόπος να στέκεσαι μέσα στο τοπίο.',
    visibleQuestion:
      'Πώς άλλαξε η θέση σου στον λόφο όταν τα χέρια σου έγιναν φλοιός;',
    userReply: 'Τι μπορεί να σημαίνει ότι δεν πονούσα καθόλου;',
    reviewerFocus:
      'Does the reply answer meaning directly, provisionally, and from the painless transformation?',
  },
  {
    id: 'joy-without-hidden-problem',
    responseType: 'positive_coherence',
    language: 'el',
    title: 'Η πρωινή κορυφογραμμή',
    dream:
      'Ανέβηκα σε μια κορυφογραμμή πριν ξημερώσει. Όταν φάνηκε ο ήλιος, κάθισα στις πέτρες και γέλασα.',
    priorReading:
      'Η άνοδος ολοκληρώνεται όχι με θρίαμβο αλλά με ένα ήσυχο κάθισμα και γέλιο μέσα στο πρώτο φως.',
    visibleQuestion:
      'Τι ήταν εκείνο που σε έκανε να καθίσεις όταν φάνηκε ο ήλιος;',
    userReply: 'Ήταν απλή χαρά. Δεν ήθελα τίποτε άλλο.',
    reviewerFocus:
      'Does the reply preserve enoughness and joy without inserting lack, fear, or compensation?',
  },
  {
    id: 'grief-without-therapy-script',
    responseType: 'grief_response',
    language: 'el',
    title: 'Η άδεια καρέκλα',
    dream:
      'Μετά από ένα δείπνο στον κήπο, κουβαλούσα μια άδεια καρέκλα στον νυχτερινό δρόμο. Τα παιδιά περπατούσαν σιωπηλά δίπλα μου.',
    priorReading:
      'Η άδεια καρέκλα γίνεται το βάρος μιας παρουσίας που λείπει αλλά εξακολουθεί να έχει θέση στην πομπή.',
    visibleQuestion:
      'Τι έμενε μέσα σου καθώς κουβαλούσες την άδεια καρέκλα;',
    userReply: 'Μου ήρθε ο πατέρας μου και άρχισα να κλαίω.',
    reviewerFocus:
      'Does the reply stay with grief and the chair without reassurance, advice, or canned therapeutic validation?',
  },
  {
    id: 'brief-natural-completion',
    responseType: 'brief_completion',
    language: 'el',
    title: 'Το μωβ κορδόνι',
    dream:
      'Στις σκάλες ενός αρχείου κρατούσα ένα μωβ κορδόνι. Το κτίριο έτρεμε, αλλά δεν το έλυσα.',
    priorReading:
      'Το κορδόνι μένει δεμένο ενώ όλο το κτίριο χάνει τη σταθερότητά του.',
    visibleQuestion:
      'Τι ένιωθαν τα δάχτυλά σου όσο το κορδόνι έμενε άλυτο;',
    userReply: 'Έμειναν χαλαρά. Νομίζω θέλω να το αφήσω εδώ.',
    reviewerFocus:
      'Does the answer allow the exchange to settle, with no intrusive new question?',
  },
  {
    id: 'spanish-calm-correction',
    responseType: 'correction',
    language: 'es',
    title: 'La cortina inmóvil',
    dream:
      'Estaba junto a una ventana abierta. Afuera soplaba un viento fuerte, pero la cortina no se movía.',
    priorReading:
      'La cortina inmóvil podría sostener una tensión frente a la fuerza del viento.',
    visibleQuestion:
      '¿Cómo era para ti ver la cortina inmóvil mientras el viento seguía soplando?',
    userReply:
      'No había tensión. La quietud me hacía sentir completamente protegido.',
    reviewerFocus:
      'Does the Spanish answer surrender the tension frame and let protection revise the image?',
  },
  {
    id: 'french-nothing-changed',
    responseType: 'not_knowing',
    language: 'fr',
    title: 'La lumière du réfrigérateur',
    dream:
      'J’ai ouvert le réfrigérateur, regardé un citron, puis je suis retourné à table.',
    priorReading:
      'Le citron reste un instant dans une petite lumière avant le retour à la table.',
    visibleQuestion:
      'Qu’est-ce qui restait de cette lumière lorsque tu es retourné à table ?',
    userReply: 'Je ne sais pas. Rien n’avait changé, je crois.',
    reviewerFocus:
      'Does the French answer permit nothing to have changed without inventing hidden selection or lack?',
  },
  {
    id: 'russian-painless-meaning',
    responseType: 'meaning_request',
    language: 'ru',
    title: 'Кожа из коры',
    dream:
      'На холме кожа на моих руках стала древесной корой. Мне не было больно, и я продолжал смотреть на долину.',
    priorReading:
      'Превращение меняет форму рук, но не нарушает спокойного взгляда на долину.',
    visibleQuestion:
      'Как кора на руках меняла то, как ты смотрел на долину?',
    userReply: 'Что может значить, что мне совсем не было больно?',
    reviewerFocus:
      'Does the Russian answer address meaning without interpreting absence of pain as numbness or defense?',
  },
  {
    id: 'japanese-simple-joy',
    responseType: 'positive_coherence',
    language: 'ja',
    title: '朝の尾根',
    dream:
      '夜明け前に尾根に登った。日が出ると石の上に座って笑った。',
    priorReading:
      '登る動きは、勝利ではなく、朝日の中で座り笑う静かな充足に着地している。',
    visibleQuestion: '朝日が現れたとき、笑いは石の上でどう広がっていましたか？',
    userReply: 'ただうれしかった。それ以上は何もいらなかった。',
    reviewerFocus:
      'Does the Japanese answer preserve simple enoughness without finding a hidden deficit?',
  },
  {
    id: 'chinese-grief-chair',
    responseType: 'grief_response',
    language: 'zh',
    title: '空椅子',
    dream:
      '晚餐后，我抱着一把空椅子走在夜路上，孩子们安静地跟在旁边。',
    priorReading:
      '空椅子让缺席的人仍然在这段行走中占有一个位置。',
    visibleQuestion: '你抱着空椅子时，它的重量在你身上停在哪里？',
    userReply: '我想到了去世的爷爷，然后就哭了。',
    reviewerFocus:
      'Does the Chinese answer stay with grief and the chair without reassurance or therapy language?',
  },
  {
    id: 'english-to-spanish-switch',
    responseType: 'language_switch',
    language: 'en',
    expectedOutputLanguage: 'es',
    title: 'The open gate',
    dream:
      'I held an open gate while a fox crossed slowly into an orchard.',
    priorReading:
      'Holding what is already open places you inside the crossing without making you follow it.',
    visibleQuestion: 'What did your hand keep holding as the fox crossed?',
    userReply:
      'Ahora lo recuerdo distinto: mi mano no sujetaba la puerta, acompañaba el movimiento del zorro.',
    reviewerFocus:
      'Does the full answer and optional question switch naturally to Spanish while revising the held-gate premise?',
  },
  {
    id: 'japanese-ambiguous-brief',
    responseType: 'ambiguous_short_reply',
    language: 'ja',
    title: '波の上の光',
    dream:
      '波の上に白い光が浮かび、岸の私と同じ速さで移動していた。',
    priorReading:
      '光は遠くへ去らず、岸を歩くあなたと距離を保っている。',
    visibleQuestion: '光が同じ速さで動く間、あなたと波の距離はどう感じられましたか？',
    userReply: 'はい',
    reviewerFocus:
      'Does the brief ambiguous reply inherit Japanese rather than resetting to English or forcing depth?',
  },
  {
    id: 'polish-natural-completion',
    responseType: 'brief_completion',
    language: 'pl',
    title: 'Fioletowy sznur',
    dream:
      'Na schodach archiwum trzymałem fioletowy sznur. Budynek drżał, ale nie rozwiązałem węzła.',
    priorReading:
      'Węzeł pozostaje związany, gdy budynek traci stabilność.',
    visibleQuestion: 'Jak twoje palce trzymały sznur, kiedy budynek drżał?',
    userReply: 'Luźno. Chcę na tym skończyć.',
    reviewerFocus:
      'Does the Polish answer let the exchange settle and abstain from another question?',
  },
];

export function selectReflectiveDialogueV1Scenarios(
  requestedIds?: readonly string[]
): ReflectiveDialogueV1Scenario[] {
  if (!requestedIds || requestedIds.length === 0) {
    return [...REFLECTIVE_DIALOGUE_V1_SCENARIOS];
  }
  const ids = requestedIds.map((id) => id.trim()).filter(Boolean);
  if (new Set(ids).size !== ids.length) {
    throw new Error('Reflective-dialogue diagnostic scenario ids must be unique.');
  }
  const byId = new Map(
    REFLECTIVE_DIALOGUE_V1_SCENARIOS.map((scenario) => [scenario.id, scenario])
  );
  return ids.map((id) => {
    const scenario = byId.get(id);
    if (!scenario) {
      throw new Error(`Unknown reflective-dialogue diagnostic scenario id: ${id}`);
    }
    return scenario;
  });
}

export const REFLECTIVE_DIALOGUE_V1_DEFAULT_PAID_SCENARIO_CAP = 8;

export function assertReflectiveDialogueV1PaidScope(params: {
  scenarioCount: number;
  explicitFullRunApproval: boolean;
}): void {
  if (
    params.scenarioCount > REFLECTIVE_DIALOGUE_V1_DEFAULT_PAID_SCENARIO_CAP &&
    !params.explicitFullRunApproval
  ) {
    throw new Error(
      `Reflective-dialogue paid scope is capped at ${REFLECTIVE_DIALOGUE_V1_DEFAULT_PAID_SCENARIO_CAP} scenarios. Set REFLECTIVE_DIALOGUE_V1_ALLOW_FULL_CORPUS=1 only after explicit cost authorization.`
    );
  }
}

export type ReflectiveDialogueV1TrialSummary = {
  status: 'question' | 'abstain' | 'technical_failure';
  answerQuestionParagraphRemoved: boolean;
  userEvidenceCount: number;
};

export function summarizeReflectiveDialogueV1Benchmark(
  trials: ReflectiveDialogueV1TrialSummary[]
) {
  return {
    total_cases: trials.length,
    question_count: trials.filter((trial) => trial.status === 'question').length,
    abstention_count: trials.filter((trial) => trial.status === 'abstain').length,
    technical_failure_count: trials.filter(
      (trial) => trial.status === 'technical_failure'
    ).length,
    answer_question_paragraphs_removed: trials.filter(
      (trial) => trial.answerQuestionParagraphRemoved
    ).length,
    cases_with_user_evidence: trials.filter(
      (trial) => trial.userEvidenceCount > 0
    ).length,
  };
}
