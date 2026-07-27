/**
 * v4.0.0 production benchmark — debug OFF, temperature 0.
 * 5 target-dream runs + 5 holdout dreams. No prompt edits between runs.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
} from '../src/ai/dreamExtractionPrompt';
import { validateStructuredTaskContent } from '../src/ai/structuredTaskValidation';
import {
  toPersistedArchetypalEcho,
  validateArchetypalEchoes,
} from '../src/ai/validators/archetypalEchoValidator';
import {
  toPersistedMythicEcho,
  validateMythicEchoes,
} from '../src/ai/validators/mythicEchoValidator';
import { estimateAiCallCost } from '../src/billing/aiPricing';

type DreamBundle = { id: string; title: string; date: string; content: string };

const TARGET: DreamBundle = {
  id: 'target_copper_vessel_lake',
  title: 'Η ξερή λίμνη και το χάλκινο δοχείο',
  date: '2026-07-27',
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

const HOLDOUTS: DreamBundle[] = [
  {
    id: 'holdout_bowl_dog_elevator',
    title: 'The Bowl, the Dog, and the Buttonless Elevator',
    date: '2026-07-20',
    content:
      'I am back in my childhood apartment carrying a shallow bowl filled with black water. A small white dog keeps looking back at me and leads me toward an elevator with no buttons. Behind frosted glass my mother calls my name, but her voice sounds as if it is underwater. I try to open a brown suitcase on the floor; it is full of damp soil and old keys, and one brass key melts into wax in my hand. The elevator doors open by themselves and take me to the roof. I am barefoot. The moon is reflected in the bowl, and I suddenly remember that I forgot my shoes downstairs.',
  },
  {
    id: 'holdout_father_double_face',
    title: 'The Private Shout',
    date: '2026-07-21',
    content:
      'My father shouts at me in the kitchen, then the relatives arrive and he becomes sweet and joking. I feel anger rise in my chest but I smile and clear the plates. No one else seems to notice the change.',
  },
  {
    id: 'holdout_wrong_timetable',
    title: 'The Incorrect Timetable',
    date: '2026-07-22',
    content:
      'An old man at the station hands me a paper timetable. The times are wrong. He leaves before I can ask. The train I need never comes, and I sit on a cold bench until morning.',
  },
  {
    id: 'holdout_flooded_classroom',
    title: 'The Flooded Classroom',
    date: '2026-07-23',
    content:
      'I am late for an exam. The classroom is flooded to the knees. My papers dissolve when I put them on the desk. The teacher watches without speaking while other students write calmly on dry desks that I cannot reach.',
  },
  {
    id: 'holdout_market_mirror',
    title: 'The Market Mirror',
    date: '2026-07-24',
    content:
      'In a crowded night market I keep seeing my face in hanging mirrors, but each reflection is slightly older. A vendor offers me a red scarf. When I refuse, the mirrors go blank and the crowd thins until I am alone with the smell of oranges.',
  },
];

function loadDotenvValue(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return undefined;
  const raw = readFileSync(envPath, 'utf8');
  const match = raw.match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'));
  if (!match) return undefined;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function stripFence(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}

function parseJson(text: string): Record<string, unknown> {
  const cleaned = stripFence(text);
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error(`No JSON object: ${text.slice(0, 200)}`);
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

function summarizeArchetypes(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const o = item as Record<string, unknown>;
    return {
      canonical_label: o.canonical_label ?? null,
      expression: o.expression ?? null,
      confidence: o.confidence ?? null,
    };
  });
}

function summarizeAmplifications(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const o = item as Record<string, unknown>;
    return {
      title: o.title ?? null,
      tradition: o.tradition ?? null,
      confidence: o.confidence ?? null,
    };
  });
}

function postValidate(rawParsed: Record<string, unknown>) {
  const validated = validateStructuredTaskContent('dream_extraction', JSON.stringify(rawParsed));
  const data = (validated.ok ? validated.data : rawParsed) as Record<string, unknown>;
  const archetypesRaw = Array.isArray(data.archetypes) ? data.archetypes : [];
  const amplificationsRaw = Array.isArray(data.amplifications) ? data.amplifications : [];
  const archetypeValidation = validateArchetypalEchoes(archetypesRaw as never, { max: 2 });
  const mythicValidation = validateMythicEchoes(amplificationsRaw as never, { max: 1 });
  return {
    post_validation_archetypes: archetypeValidation.accepted.map(toPersistedArchetypalEcho),
    post_validation_amplifications: mythicValidation.accepted.map(toPersistedMythicEcho),
  };
}

async function main() {
  if (DREAM_EXTRACTION_PROMPT_VERSION !== '4.0.0') {
    throw new Error(`Expected 4.0.0, got ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  }
  if (DREAM_EXTRACTION_TEMPERATURE !== 0) {
    throw new Error(`Expected temperature 0, got ${DREAM_EXTRACTION_TEMPERATURE}`);
  }

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/, '');
  const anon = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT']);
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  let token = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']);
  if (!supabaseUrl || !anon || !endpoint) throw new Error('Missing supabase/proxy env');
  if (!token) {
    if (!email || !password) throw new Error('Missing LIVE_SUPABASE_EMAIL/PASSWORD');
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anon },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`auth failed ${res.status}: ${text.slice(0, 300)}`);
    token = (JSON.parse(text) as { access_token?: string }).access_token || '';
    if (!token) throw new Error('no access token');
  }

  const outDir = path.join(process.cwd(), 'tmp', 'v4.0.0-production-benchmark');
  mkdirSync(outDir, { recursive: true });

  const probe = buildDreamExtractionUserPrompt({
    title: TARGET.title,
    date: TARGET.date,
    content: TARGET.content,
    finalInterpretation: null,
    debugInterpretiveEchoes: false,
  });
  if (probe.includes('DEBUG INTERPRETIVE ECHOES')) throw new Error('debug suffix leaked');
  if (probe.includes('dream_map') || probe.includes('archetype_audit')) {
    throw new Error('legacy diagnostics in production user prompt');
  }

  writeFileSync(
    path.join(outDir, 'dreams_used.json'),
    JSON.stringify(
      {
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        temperature: DREAM_EXTRACTION_TEMPERATURE,
        debug_suffix: false,
        reflection: null,
        target: TARGET,
        holdouts: HOLDOUTS,
      },
      null,
      2
    )
  );

  async function extract(label: string, dream: DreamBundle) {
    const system = buildDreamExtractionSystemPrompt();
    const user = buildDreamExtractionUserPrompt({
      title: dream.title,
      date: dream.date,
      content: dream.content,
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
          { role: 'user', content: user },
        ],
        temperature: DREAM_EXTRACTION_TEMPERATURE,
        max_completion_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        max_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        response_format: { type: 'json_object' },
      }),
    });
    const text = await res.text();
    const latency_ms = Date.now() - started;
    if (!res.ok) throw new Error(`${label} proxy ${res.status}: ${text.slice(0, 500)}`);
    const body = JSON.parse(text) as Record<string, unknown>;
    const content =
      (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ??
      (typeof body.content === 'string' ? body.content : '') ??
      '';
    const rawParsed = parseJson(String(content));
    const post = postValidate(rawParsed);
    const cost =
      body.ai_call_cost && typeof body.ai_call_cost === 'object'
        ? body.ai_call_cost
        : estimateAiCallCost(body, typeof body.provider === 'string' ? body.provider : 'openai');

    const packet = {
      run: label,
      dream_id: dream.id,
      debug_suffix: false,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
      model: body.model ?? null,
      temperature: DREAM_EXTRACTION_TEMPERATURE,
      latency_ms,
      cost,
      raw_archetypes: summarizeArchetypes(rawParsed.archetypes),
      post_validation_archetypes: summarizeArchetypes(post.post_validation_archetypes),
      raw_amplifications: summarizeAmplifications(rawParsed.amplifications),
      post_validation_amplifications: summarizeAmplifications(post.post_validation_amplifications),
    };
    writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify(packet, null, 2));
    console.log(
      JSON.stringify({
        run: label,
        latency_ms,
        estimatedUsd: (cost as { estimatedUsd?: number } | null)?.estimatedUsd ?? null,
        raw_archetypes: packet.raw_archetypes,
        post_archetypes: packet.post_validation_archetypes,
        raw_amplifications: packet.raw_amplifications,
        post_amplifications: packet.post_validation_amplifications,
      })
    );
    return packet;
  }

  const runs: Array<Record<string, unknown>> = [];
  for (let i = 1; i <= 5; i++) {
    runs.push(await extract(`target_${i}`, TARGET));
  }
  for (let i = 0; i < HOLDOUTS.length; i++) {
    runs.push(await extract(`holdout_${i + 1}_${HOLDOUTS[i].id}`, HOLDOUTS[i]));
  }

  const targetRuns = runs.filter((r) => String(r.run).startsWith('target_'));
  const acceptance = {
    trickster_ge_4: targetRuns.filter((r) =>
      JSON.stringify(r.post_validation_archetypes).includes('Trickster')
    ).length,
    wise_old_woman_le_1: targetRuns.filter((r) =>
      JSON.stringify(r.post_validation_archetypes).includes('Wise Old Woman')
    ).length,
    fisherman_ge_4: targetRuns.filter((r) =>
      /Fisherman and the Jinni/i.test(JSON.stringify(r.post_validation_amplifications))
    ).length,
    forbidden_myth_hits: targetRuns.filter((r) => {
      const t = JSON.stringify(r.post_validation_amplifications);
      return /Aladdin|Fisher King|Gyges|Jinn in the Bottle|δαίμονας στο μπουκάλι/i.test(t);
    }).length,
  };

  const summary = {
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    temperature: DREAM_EXTRACTION_TEMPERATURE,
    debug_suffix: false,
    acceptance,
    runs: runs.map((r) => ({
      run: r.run,
      dream_id: r.dream_id,
      latency_ms: r.latency_ms,
      cost: r.cost,
      raw_archetypes: r.raw_archetypes,
      post_validation_archetypes: r.post_validation_archetypes,
      raw_amplifications: r.raw_amplifications,
      post_validation_amplifications: r.post_validation_amplifications,
    })),
  };
  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
