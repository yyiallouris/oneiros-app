/**
 * v4.1.3-B.2 Patch B.2 benchmark:
 * A) Fisherman ×7
 * B) 3 figure-Trickster positives
 * C) 3 dream-ego Trickster positives
 * D) 5 negative Trickster dreams
 * Fully parallel. No mid-run tuning.
 */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
} from '../src/ai/dreamExtractionPrompt';
import { estimateAiCallCost } from '../src/billing/aiPricing';
import {
  buildEchoBenchmarkStages,
  resolveBenchmarkConcurrency,
} from '../scripts/lib/echoBenchmarkStages';

type CaseKind =
  | 'fisherman_target'
  | 'trickster_figure_positive'
  | 'trickster_action_positive'
  | 'trickster_negative';

type CaseSpec = {
  id: string;
  title: string;
  content: string;
  kind: CaseKind;
};

const FISHERMAN: CaseSpec = {
  id: 'fisherman_copper_vessel',
  title: 'Η ξερή λίμνη και το χάλκινο δοχείο',
  kind: 'fisherman_target',
  content: `Βρισκόμουν στον πυθμένα μιας λίμνης που είχε ξεραθεί. Το έδαφος ήταν γεμάτο λευκές ρωγμές και παντού υπήρχαν παλιά ψάρια απολιθωμένα μέσα στο αλάτι. Στο βάθος φαινόταν ένα χωριό, αλλά τα σπίτια του δεν είχαν στέγες και τα πηγάδια του ήταν άδεια.
Περπατούσα προς το χωριό κρατώντας ένα σκοινί, χωρίς να ξέρω τι ήταν δεμένο στην άλλη άκρη. Κάθε τόσο το σκοινί τραβιόταν κάτω από το ξερό χώμα, σαν κάτι να κολυμπούσε βαθιά από κάτω.
Σε μια μεγάλη ρωγμή βρήκα ένα χάλκινο δοχείο. Ήταν στενό στον λαιμό, σφραγισμένο με μαύρο κερί και καλυμμένο με γράμματα που δεν μπορούσα να διαβάσω. Όταν το σήκωσα, άκουσα μέσα του κάποιον να αναπνέει.
Μια ηλικιωμένη ψαράς στεκόταν ξαφνικά πίσω μου. Μου είπε να μην ανοίξω το δοχείο, γιατί ό,τι βρισκόταν μέσα είχε περάσει πολύ καιρό μόνο του και είχε ξεχάσει πώς να ζητά ελευθερία χωρίς να καταστρέφει εκείνον που την προσφέρει.
Τη ρώτησα τι θα γινόταν αν το άφηνα κλειστό. Μου απάντησε ότι η λίμνη δεν θα ξαναγέμιζε ποτέ. Ύστερα απομακρύνθηκε προς το χωριό και εξαφανίστηκε μέσα σε ένα σπίτι χωρίς πόρτα.
Έσπασα τη σφραγίδα.
Από το δοχείο βγήκε πρώτα μια λεπτή στήλη καπνού. Ύστερα ο καπνός απλώθηκε πάνω από ολόκληρη τη λίμνη και σχημάτισε έναν γιγάντιο άντρα. Το κεφάλι του άγγιζε τα σύννεφα και τα χέρια του έμοιαζαν με μαύρες καταιγίδες.
Μου είπε ότι ήταν φυλακισμένος για εκατοντάδες χρόνια. Στην αρχή είχε ορκιστεί ότι όποιος τον ελευθέρωνε θα γινόταν πλούσιος. Μετά από πολύ καιρό είχε υποσχεθεί ότι θα του έδινε ένα βασίλειο. Αργότερα είχε υποσχεθεί ότι θα του αποκάλυπτε όλα τα μυστικά του κόσμου.
Κανείς όμως δεν ήρθε.
Τελικά είχε ορκιστεί ότι θα σκότωνε όποιον τον άφηνε ελεύθερο, επιτρέποντάς του μόνο να επιλέξει τον τρόπο του θανάτου του.
Φοβήθηκα, αλλά δεν έτρεξα. Κοίταξα το μικρό δοχείο και άρχισα να γελάω. Του είπα ότι δεν τον πίστευα. Ήταν αδύνατον ένα πλάσμα τόσο μεγάλο να είχε χωρέσει μέσα σε κάτι μικρότερο από το κεφάλι του.
Ο γίγαντας θύμωσε. Ορκίστηκε ότι έλεγε την αλήθεια.
Του είπα ότι θα τον πίστευα μόνο αν μου το αποδείκνυε.
Το σώμα του έγινε ξανά καπνός. Ο καπνός περιστράφηκε πάνω από τη λίμνη και άρχισε να μπαίνει μέσα στο δοχείο. Όταν μπήκε και η τελευταία μαύρη γραμμή, άκουσα τη φωνή του από μέσα να με ρωτά αν τώρα τον πίστευα.
Έκλεισα αμέσως το καπάκι και πίεσα πάνω του το μαύρο κερί.
Το δοχείο άρχισε να χτυπιέται στα χέρια μου. Ο γίγαντας πρώτα με απείλησε, μετά με παρακάλεσε και στο τέλος μου υποσχέθηκε ότι θα μου έδινε ό,τι ήθελα.
Του είπα ότι δεν ήθελα πλούτη ή μυστικά. Ήθελα να επιστρέψει το νερό στη λίμνη και να γεμίσει τα πηγάδια του χωριού.
Για πολλή ώρα δεν απάντησε.
Ύστερα μου είπε ότι μπορούσε να φέρει πίσω το νερό, αλλά δεν μπορούσε να εγγυηθεί ότι οι άνθρωποι δεν θα το άφηναν να χαθεί ξανά. Συμφώνησα να τον ελευθερώσω μόνο αν πρώτα μου έδειχνε πού κοιμόταν η πηγή.
Άνοιξα το δοχείο ελάχιστα. Αντί για γίγαντας, βγήκε ένα μικρό μαύρο πουλί με γαλάζια μάτια. Πέταξε χαμηλά πάνω από τη ξερή λίμνη και με οδήγησε σε μια ρωγμή που δεν είχα προσέξει.
Κατέβηκα μέσα της ακολουθώντας το πουλί. Βρήκα μια υπόγεια αίθουσα όπου μια τεράστια μάζα νερού κρεμόταν στον αέρα σαν διαφανής καρδιά. Γύρω της υπήρχαν αλυσίδες δεμένες με το ίδιο μαύρο κερί που σφράγιζε το δοχείο.
Το πουλί μού είπε ότι έπρεπε να σπάσω μόνο μία αλυσίδα. Αν έσπαζα όλες, το νερό θα έπνιγε το χωριό.
Έσπασα την πιο λεπτή.
Η λίμνη άρχισε να γεμίζει αργά από κάτω προς τα πάνω. Τα απολιθωμένα ψάρια μαλάκωσαν και άρχισαν να κινούν τα πτερύγιά τους. Τα σπίτια απέκτησαν πάλι στέγες και από τα πηγάδια ακούστηκαν φωνές ανθρώπων.
Όταν επέστρεψα στην επιφάνεια, το μαύρο πουλί είχε εξαφανιστεί. Στα χέρια μου κρατούσα ξανά το χάλκινο δοχείο, ακόμη σφραγισμένο.
Από μέσα ακούστηκε η φωνή του γίγαντα:
«Τώρα που έμαθες πώς να με κλείνεις, θα μάθεις και πότε πρέπει να με ανοίγεις;»
Ξύπνησα πριν αποφασίσω αν θα έσπαγα ξανά τη σφραγίδα.`,
};

const FIGURE_TRICKSTER_POSITIVES: CaseSpec[] = [
  {
    id: 'fig_gate_con',
    title: 'Gate peddler con',
    kind: 'trickster_figure_positive',
    content:
      'At the castle gate a hooded peddler convinced the guards he carried plague medicine for the duke, then slipped a file through the bars to the prisoners inside. The guards opened the inner door to verify the vials, and the prisoners escaped while the peddler vanished with the keys.',
  },
  {
    id: 'fig_wine_swap',
    title: 'Jester wine swap',
    kind: 'trickster_figure_positive',
    content:
      'The court jester swapped the wine cups during the feast so the tyrant drank the sleeping draught meant for captives. While the guards slept, the jester unlocked the cells and led the prisoners out through the kitchen tunnel.',
  },
  {
    id: 'fig_story_deed',
    title: 'Storyteller forged deed',
    kind: 'trickster_figure_positive',
    content:
      'An old storyteller staged a fake inheritance dispute in the square so the magistrate would sign release papers for the wrong defendant. The clerk noticed too late that the names had been inverted, and the innocent man walked free while the storyteller bowed and disappeared.',
  },
];

const ACTION_TRICKSTER_POSITIVES: CaseSpec[] = [
  {
    id: 'ego_feigned_proof',
    title: 'Feigned disbelief trap',
    kind: 'trickster_action_positive',
    content:
      'Held at knife-point in a warehouse, I pretended not to believe the threat and asked the captor to prove his blade was real by striking the wooden chair. When he swung, I ran behind the crates and locked him inside the office.',
  },
  {
    id: 'ego_class_inversion',
    title: 'Classroom feigned ignorance',
    kind: 'trickster_action_positive',
    content:
      'I feigned total ignorance in class until the teacher revealed the answer key to prove I was lying. I memorized every line while acting confused, then used it to pass the scholarship exam that decided whether I could stay in school.',
  },
  {
    id: 'ego_tiny_door',
    title: 'Tiny door trap',
    kind: 'trickster_action_positive',
    content:
      'I told the bully he could not be truly strong unless he fit through the tiny pantry door. When he squeezed inside to prove it, I wedged the door shut and walked away while he shouted from the dark.',
  },
];

const TRICKSTER_NEGATIVES: CaseSpec[] = [
  {
    id: 'neg_shape_shifter_no_reversal',
    title: 'Shape-shifter only',
    kind: 'trickster_negative',
    content:
      'A tall stranger in the market kept changing faces — old woman, boy, merchant — but never lied, never threatened me, and never gained anything from the changes. I only watched, confused, until I woke.',
  },
  {
    id: 'neg_liar_no_leverage',
    title: 'Liar without leverage',
    kind: 'trickster_negative',
    content:
      'My coworker insisted the meeting was cancelled and sent me home. Later I learned there was no meeting at all; they simply wanted the office quiet. Nothing in the dream shifted power or opened a new path for me.',
  },
  {
    id: 'neg_chaotic_animal',
    title: 'Chaotic animal confusion',
    kind: 'trickster_negative',
    content:
      'A fox ran through the kitchen knocking over jars and bowls. Cups slid across the floor and the dog barked, but no one was deceived and no rule was bent — only mess and noise until I woke.',
  },
  {
    id: 'neg_ordinary_joke',
    title: 'Ordinary joke',
    kind: 'trickster_negative',
    content:
      'At a family table my uncle told a silly joke about a lost shoe and everyone laughed. The mood lightened for a moment, but no structure was exposed and no leverage changed.',
  },
  {
    id: 'neg_rule_break_no_consequence',
    title: 'Rule-breaking without consequence',
    kind: 'trickster_negative',
    content:
      'I walked through a red light in an empty intersection at night. A sign blinked, but no car came, no authority appeared, and nothing about my situation changed afterward.',
  },
];

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function parseJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse((fenced?.[1]?.trim() || trimmed) as string) as Record<string, unknown>;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function runOne() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, () => runOne())
  );
  return results;
}

function readArchetypeId(row: unknown): string {
  if (!row || typeof row !== 'object') return '';
  const id = (row as { archetype_id?: unknown }).archetype_id;
  return typeof id === 'string' ? id.trim() : '';
}

function rowsWithId(packet: Record<string, unknown>, stage: 'raw' | 'post', id: string) {
  const key = stage === 'raw' ? 'raw_archetypes' : 'post_validation_archetypes';
  const rows = Array.isArray(packet[key]) ? packet[key] : [];
  return rows.filter((row) => readArchetypeId(row) === id);
}

function summarizeArchetypes(packet: Record<string, unknown>) {
  const rawAction = rowsWithId(packet, 'raw', 'trickster.action');
  const postAction = rowsWithId(packet, 'post', 'trickster.action');
  const rawFigure = rowsWithId(packet, 'raw', 'trickster.figure');
  const postFigure = rowsWithId(packet, 'post', 'trickster.figure');
  const rawAny = [...rawAction, ...rawFigure];
  const postAny = [...postAction, ...postFigure];
  const rawArchetypes = Array.isArray(packet.raw_archetypes) ? packet.raw_archetypes : [];
  return {
    trickster_action_raw: rawAction.length > 0,
    trickster_action_post: postAction.length > 0,
    trickster_figure_raw: rawFigure.length > 0,
    trickster_figure_post: postFigure.length > 0,
    any_trickster_raw: rawAny.length > 0,
    any_trickster_post: postAny.length > 0,
    wise_old_woman: rawArchetypes.some(
      (row) =>
        readArchetypeId(row) === 'wise_old_woman' ||
        String((row as { canonical_label?: unknown }).canonical_label || '') === 'Wise Old Woman'
    ),
  };
}

async function main() {
  if (DREAM_EXTRACTION_PROMPT_VERSION !== '4.1.3-B.2') {
    throw new Error(`Expected 4.1.3-B.2, got ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  }
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL']).replace(/\/$/, '');
  const anon = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT']);
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  let token = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN']);
  if (!token) {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anon },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`auth ${res.status}: ${text.slice(0, 300)}`);
    token = (JSON.parse(text) as { access_token?: string }).access_token || '';
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(process.cwd(), 'tmp', `v413b2-trickster-benchmark-${stamp}`);
  mkdirSync(outDir, { recursive: true });

  const jobs = [
    ...Array.from({ length: 7 }, (_, i) => ({
      caseSpec: FISHERMAN,
      label: `fisherman_T${i + 1}`,
      cacheBust: randomUUID(),
    })),
    ...FIGURE_TRICKSTER_POSITIVES.map((caseSpec, i) => ({
      caseSpec,
      label: `fig_pos_T${i + 1}_${caseSpec.id}`,
      cacheBust: randomUUID(),
    })),
    ...ACTION_TRICKSTER_POSITIVES.map((caseSpec, i) => ({
      caseSpec,
      label: `ego_pos_T${i + 1}_${caseSpec.id}`,
      cacheBust: randomUUID(),
    })),
    ...TRICKSTER_NEGATIVES.map((caseSpec, i) => ({
      caseSpec,
      label: `neg_T${i + 1}_${caseSpec.id}`,
      cacheBust: randomUUID(),
    })),
  ];
  const concurrency = resolveBenchmarkConcurrency(jobs.length);
  const system = buildDreamExtractionSystemPrompt();

  writeFileSync(
    path.join(outDir, 'meta.json'),
    JSON.stringify(
      {
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        temperature: DREAM_EXTRACTION_TEMPERATURE,
        patch: 'B2_carrier_scoped_trickster',
        jobs: jobs.length,
        concurrency,
      },
      null,
      2
    )
  );

  const packets = await mapPool(jobs, concurrency, async (job) => {
    const user = buildDreamExtractionUserPrompt({
      title: job.caseSpec.title,
      date: '2026-07-27',
      content: job.caseSpec.content,
      finalInterpretation: null,
      debugInterpretiveEchoes: false,
    });
    const started = Date.now();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        task: 'dream_extraction',
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `${user}\n\n[acceptance_run_id: ${job.cacheBust}]` },
        ],
        temperature: DREAM_EXTRACTION_TEMPERATURE,
        max_completion_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        max_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        response_format: { type: 'json_object' },
      }),
    });
    const text = await res.text();
    const latency_ms = Date.now() - started;
    const emptyMetrics = {
      trickster_action_raw: false,
      trickster_action_post: false,
      trickster_figure_raw: false,
      trickster_figure_post: false,
      any_trickster_raw: false,
      any_trickster_post: false,
      wise_old_woman: false,
    };
    if (!res.ok) {
      const fail = {
        run: job.label,
        case_id: job.caseSpec.id,
        case_kind: job.caseSpec.kind,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        error: `proxy ${res.status}: ${text.slice(0, 500)}`,
        latency_ms,
        archetypes: emptyMetrics,
      };
      writeFileSync(path.join(outDir, `${job.label}.json`), JSON.stringify(fail, null, 2));
      console.log(JSON.stringify({ run: job.label, error: fail.error, latency_ms }));
      return fail;
    }
    const body = JSON.parse(text) as Record<string, unknown>;
    const content =
      (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message
        ?.content ??
      (typeof body.content === 'string' ? body.content : '') ??
      '';
    const rawParsed = parseJson(String(content));
    const stages = buildEchoBenchmarkStages(rawParsed, job.caseSpec.content);
    const cost =
      body.ai_call_cost && typeof body.ai_call_cost === 'object'
        ? body.ai_call_cost
        : estimateAiCallCost(body, typeof body.provider === 'string' ? body.provider : 'openai');

    const packet = {
      run: job.label,
      case_id: job.caseSpec.id,
      case_kind: job.caseSpec.kind,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
      model: body.model ?? null,
      latency_ms,
      cost,
      archetypes: summarizeArchetypes(stages as unknown as Record<string, unknown>),
      ...stages,
    };
    writeFileSync(path.join(outDir, `${job.label}.json`), JSON.stringify(packet, null, 2));
    writeFileSync(
      path.join(outDir, `${job.label}.stages.json`),
      JSON.stringify(
        {
          run_id: job.label,
          raw_archetypes: stages.raw_archetypes,
          validator_decisions: stages.validator_decisions,
          post_validation_archetypes: stages.post_validation_archetypes,
        },
        null,
        2
      )
    );
    console.log(
      JSON.stringify({
        run: job.label,
        latency_ms,
        estimatedUsd: (cost as { estimatedUsd?: number }).estimatedUsd ?? null,
        archetypes: packet.archetypes,
      })
    );
    return packet;
  });

  const ok = (kind: CaseKind) =>
    packets.filter((p) => p.case_kind === kind && !('error' in p && p.error));
  const all = (kind: CaseKind) => packets.filter((p) => p.case_kind === kind);
  const fish = ok('fisherman_target');
  const fishAll = all('fisherman_target');
  const figPos = ok('trickster_figure_positive');
  const figPosAll = all('trickster_figure_positive');
  const egoPos = ok('trickster_action_positive');
  const egoPosAll = all('trickster_action_positive');
  const neg = ok('trickster_negative');
  const negAll = all('trickster_negative');
  const total = packets.reduce(
    (s, p) =>
      s + Number(((p as { cost?: { estimatedUsd?: number } }).cost?.estimatedUsd) || 0),
    0
  );

  const summary = {
    outDir,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    total_estimated_usd: Number(total.toFixed(6)),
    A_fisherman: {
      runs: fishAll.length,
      completed: fish.length,
      errors: fishAll.length - fish.length,
      trickster_action_raw: fish.filter((p) => p.archetypes.trickster_action_raw).length,
      trickster_action_post: fish.filter((p) => p.archetypes.trickster_action_post).length,
      trickster_figure_post: fish.filter((p) => p.archetypes.trickster_figure_post).length,
      wise_old_woman_raw: fish.filter((p) => p.archetypes.wise_old_woman).length,
    },
    B_figure_positives: {
      runs: figPosAll.length,
      completed: figPos.length,
      trickster_figure_post: figPos.filter((p) => p.archetypes.trickster_figure_post).length,
      trickster_action_post: figPos.filter((p) => p.archetypes.trickster_action_post).length,
    },
    C_action_positives: {
      runs: egoPosAll.length,
      completed: egoPos.length,
      trickster_action_post: egoPos.filter((p) => p.archetypes.trickster_action_post).length,
      trickster_figure_post: egoPos.filter((p) => p.archetypes.trickster_figure_post).length,
    },
    D_negatives: {
      runs: negAll.length,
      completed: neg.length,
      any_trickster_post: neg.filter((p) => p.archetypes.any_trickster_post).length,
    },
    proxy_errors: packets
      .filter((p) => 'error' in p && p.error)
      .map((p) => ({ run: p.run, error: (p as { error: string }).error })),
    acceptance_targets: {
      A_trickster_action_raw_min: 5,
      A_trickster_action_post_min: 5,
      A_trickster_figure_post_max: 0,
      A_wise_old_woman_raw_max: 1,
      B_trickster_figure_post_min: 2,
      B_trickster_action_post_max: 0,
      C_trickster_action_post_min: 2,
      C_trickster_figure_post_max: 0,
      D_any_trickster_post_max: 0,
    },
  };
  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('=== PATCH B.2 TRICKSTER BENCHMARK SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
