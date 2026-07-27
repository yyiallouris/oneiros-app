/**
 * v4.1.2 Patch A smoke: Fisherman ×5 + Sisyphus ×3, fully parallel.
 * No mid-run tuning. Records evidence_ids + resolved evidence + validator decisions.
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
import { buildDreamEvidenceSpanIndex } from '../src/ai/dreamEvidenceSpans';

type CaseSpec = {
  id: string;
  title: string;
  content: string;
  required_myth_catalog_id: string;
};

const FISHERMAN: CaseSpec = {
  id: 'fisherman_copper_vessel',
  title: 'Η ξερή λίμνη και το χάλκινο δοχείο',
  required_myth_catalog_id: 'arabian.fisherman_and_jinni',
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

const SISYPHUS: CaseSpec = {
  id: 'sisyphus_hill',
  title: 'C3_no_archetype_plus_myth',
  required_myth_catalog_id: 'greek.sisyphus',
  content: `Βρισκόμουν σε έναν γυμνό λόφο και έσπρωχνα μια τεράστια στρογγυλή πέτρα προς την κορυφή. Δεν υπήρχε κανείς να με παρακολουθεί και δεν ένιωθα ούτε γενναίος ούτε φοβισμένος· μόνο ήξερα ότι έπρεπε να τη φτάσω πάνω. Κάθε φορά που η πέτρα πλησίαζε στην κορυφή, ακουγόταν ένα μικρό κουδούνι και η πέτρα γλιστρούσε από τα χέρια μου, κυλούσε μέχρι κάτω και σταματούσε ακριβώς στο ίδιο σημείο. Κατέβαινα, έβαζα πάλι τα χέρια μου πάνω της και ξεκινούσα από την αρχή. Ξύπνησα λίγο πριν την σπρώξω για ακόμη μία φορά.`,
};

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

async function main() {
  if (DREAM_EXTRACTION_PROMPT_VERSION !== '4.1.2') {
    throw new Error(`Expected 4.1.2, got ${DREAM_EXTRACTION_PROMPT_VERSION}`);
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
  const outDir = path.join(process.cwd(), 'tmp', `v412-patchA-fisherman-sisyphus-${stamp}`);
  mkdirSync(outDir, { recursive: true });

  const jobs = [
    ...Array.from({ length: 5 }, (_, i) => ({
      caseSpec: FISHERMAN,
      label: `fisherman_T${i + 1}`,
      cacheBust: randomUUID(),
    })),
    ...Array.from({ length: 3 }, (_, i) => ({
      caseSpec: SISYPHUS,
      label: `sisyphus_R${i + 1}`,
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
        patch: 'A_evidence_ids',
        jobs: jobs.length,
        concurrency,
        span_counts: {
          fisherman: buildDreamEvidenceSpanIndex(FISHERMAN.content).spans.length,
          sisyphus: buildDreamEvidenceSpanIndex(SISYPHUS.content).spans.length,
        },
      },
      null,
      2
    )
  );

  console.log(
    JSON.stringify({
      stage: 'start',
      jobs: jobs.length,
      concurrency,
      outDir,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    })
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
    if (!res.ok) throw new Error(`${job.label} proxy ${res.status}: ${text.slice(0, 400)}`);
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

    const rawMyth = Array.isArray(stages.raw_amplifications) ? stages.raw_amplifications[0] : null;
    const rawMythObj =
      rawMyth && typeof rawMyth === 'object' ? (rawMyth as Record<string, unknown>) : null;

    const packet = {
      run: job.label,
      case_id: job.caseSpec.id,
      required_myth_catalog_id: job.caseSpec.required_myth_catalog_id,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
      model: body.model ?? null,
      latency_ms,
      cost,
      raw_myth_catalog_id: rawMythObj?.catalog_id ?? null,
      raw_evidence_ids: rawMythObj?.evidence_ids ?? null,
      raw_evidence_text: rawMythObj?.evidence ?? null,
      post_myth_catalog_id: stages.post_validation_amplifications[0]?.catalog_id ?? null,
      post_resolved_evidence: stages.post_validation_amplifications[0]?.evidence ?? [],
      mythic_reject_reasons: stages.mythic_reject_reasons,
      mythic_rejected: stages.mythic_rejected,
      raw_archetypes: stages.raw_archetypes,
      validator_decisions: stages.validator_decisions,
      post_validation_archetypes: stages.post_validation_archetypes,
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
          raw_amplifications: stages.raw_amplifications,
          post_validation_amplifications: stages.post_validation_amplifications,
          mythic_rejected: stages.mythic_rejected,
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
        raw_myth: packet.raw_myth_catalog_id,
        post_myth: packet.post_myth_catalog_id,
        evidence_ids: packet.raw_evidence_ids,
        rejects: packet.mythic_reject_reasons,
      })
    );
    return packet;
  });

  const fish = packets.filter((p) => String(p.run).startsWith('fisherman_'));
  const sis = packets.filter((p) => String(p.run).startsWith('sisyphus_'));
  const total = packets.reduce(
    (s, p) => s + Number(((p.cost as { estimatedUsd?: number })?.estimatedUsd) || 0),
    0
  );
  const summary = {
    outDir,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    total_estimated_usd: Number(total.toFixed(6)),
    fisherman: {
      runs: fish.length,
      raw_correct: fish.filter((p) => p.raw_myth_catalog_id === 'arabian.fisherman_and_jinni').length,
      post_correct: fish.filter((p) => p.post_myth_catalog_id === 'arabian.fisherman_and_jinni')
        .length,
      reject_reasons: fish.flatMap((p) => p.mythic_reject_reasons as string[]),
    },
    sisyphus: {
      runs: sis.length,
      raw_correct: sis.filter((p) => p.raw_myth_catalog_id === 'greek.sisyphus').length,
      post_correct: sis.filter((p) => p.post_myth_catalog_id === 'greek.sisyphus').length,
      reject_reasons: sis.flatMap((p) => p.mythic_reject_reasons as string[]),
    },
  };
  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('=== PATCH A FISHERMAN+SISYPHUS SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
