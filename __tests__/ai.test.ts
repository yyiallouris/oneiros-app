import {
  buildDreamDisplayMap,
  extractDreamSymbolsAndArchetypes,
  generateInitialInterpretation,
  mergeConversationElementUpdates,
} from '../src/services/ai';
import { buildDreamExtractionResponseFormat } from '../src/ai/dreamExtractionResponseFormat';
import {
  REFLECTION_EDITORIAL_ARC_PAYLOAD_END,
  REFLECTION_EDITORIAL_ARC_PAYLOAD_START,
  REFLECTION_EDITORIAL_ARC_READING_START,
} from '../src/ai/reflectionEditorialArc';
import type { Dream, Interpretation } from '../src/types/dream';

jest.mock('../src/services/userSettingsService', () => ({
  ...jest.requireActual('../src/services/userSettingsService'),
  getMythicResonance: jest.fn().mockResolvedValue(false),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      openaiApiKey: 'test-key',
      customGptEndpoint: null,
      gptModel: 'gpt-5.4-mini',
    },
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

function apiResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null as string | null },
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

function editorialArcResponse(reading: string, language: string = 'en'): string {
  return [
    REFLECTION_EDITORIAL_ARC_PAYLOAD_START,
    JSON.stringify({ question: null, question_evidence_ids: [], output_language: language }),
    REFLECTION_EDITORIAL_ARC_PAYLOAD_END,
    REFLECTION_EDITORIAL_ARC_READING_START,
    reading,
    '<!--END_DREAM_READING-->',
  ].join('\n');
}

const dreamFixture = (overrides: Partial<Dream> = {}): Dream => ({
  id: 'dream-1',
  title: 'Test',
  date: '2024-01-01',
  content: 'A red door would not open.',
  archived: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

async function loadAiWithProxyEndpoint() {
  jest.resetModules();
  delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_ANON_KEY;
  jest.doMock('expo-constants', () => ({
    expoConfig: {
      version: '1.0.0',
      extra: {
        openaiApiKey: 'test-key',
        customGptEndpoint: 'https://project.supabase.co/functions/v1/openai-proxy',
        gptModel: 'ignored-by-proxy',
      },
    },
  }));
  jest.doMock('../src/services/userSettingsService', () => ({
    ...jest.requireActual('../src/services/userSettingsService'),
    getMythicResonance: jest.fn().mockResolvedValue(false),
  }));
  return require('../src/services/ai') as typeof import('../src/services/ai');
}

describe('ai service', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns interpretation when API succeeds', async () => {
    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [
          {
            message: { content: editorialArcResponse('Analysis result') },
            finish_reason: 'stop',
          },
        ],
      })
    );

    const result = await generateInitialInterpretation({
      id: '1',
      title: 'Test',
      date: '2024-01-01',
      content: 'Dream text',
      archived: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });

    expect(result).toBe('Analysis result');
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1);
    const interpretationBody = JSON.parse(mockFetch.mock.calls.at(-1)?.[1]?.body as string);
    expect(interpretationBody.model).toBe('gpt-5.4-mini');
    expect(interpretationBody.max_completion_tokens).toBe(1600);
    expect(interpretationBody.max_tokens).toBeUndefined();
    const userMsg = interpretationBody.messages.find((m: { role: string }) => m.role === 'user')?.content ?? '';
    expect(userMsg).toMatch(/OUTPUT LANGUAGE/);
    expect(userMsg).toMatch(/same primary language/);
  });

  it('uses restrained extraction as UI metadata mapping', async () => {
    const extractionJson = {
      display_distillation: {
        essence_title: 'Blocked red threshold',
        essence_line: 'The dream gathers around a blocked wish to enter.',
        dominant_lens: 'Threshold',
        visible_anchors: [
          {
            label: 'red door',
            type: 'Threshold',
            salience: 5,
            ui_meaning:
              'a charged point of entry that keeps carrying more detail than the DreamDetail card should ever show in its compact anchor summary because the model kept adding explanatory prose beyond the UI limit',
          },
          { label: 'The red door', type: 'image', salience: 4, ui_meaning: 'duplicate should be ignored' },
          { label: 'wanting entry', type: 'tension', salience: 4, ui_meaning: 'the pressure to cross' },
          { label: 'blocked handle', type: 'image', salience: 3, ui_meaning: 'the door will not yield' },
          { label: 'frustration', type: 'Feeling', salience: 3, ui_meaning: 'the felt weather of the scene' },
          { label: 'waiting outside', type: 'archetypal echo', salience: 2, ui_meaning: 'kept at a distance' },
          { label: 'extra anchor', type: 'image', salience: 1, ui_meaning: 'should be capped out' },
        ],
        main_tension: 'entry vs blockage',
        dream_movement: 'Approaching',
        movement_line: 'The dream approaches the threshold without crossing.',
      },
      symbols: ['red door'],
      symbol_stances: [{ symbol: 'red door', stance: 'blocked, charged' }],
      archetypes: [],
      landscapes: [],
      affects: ['tension'],
      motifs: ['blocked threshold'],
      relational_dynamics: [],
      thresholds: ['closed door'],
      central_conflicts: ['closed door vs wanting entry'],
      core_mode: 'Core Tension',
      amplifications: [],
    };

    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [
          {
            message: {
              content: JSON.stringify(extractionJson),
            },
            finish_reason: 'stop',
          },
        ],
      })
    );

    const extraction = await extractDreamSymbolsAndArchetypes(
      {
        id: '1',
        title: 'Small dream',
        date: '2024-01-01',
        content: 'A red door would not open.',
        archived: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      'The red door carries the strongest pressure because it blocks entry.'
    );

    const extractionBody = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string);
    const systemText = extractionBody.messages
      .filter((m: { role: string }) => m.role === 'system')
      .map((m: { content: string }) => m.content)
      .join('\n');
    const userMsg = extractionBody.messages.find((m: { role: string }) => m.role === 'user')?.content ?? '';

    expect(systemText).toMatch(/map dream elements for two different purposes/i);
    expect(systemText).toMatch(/Immediate UI display distillation/);
    expect(systemText).toMatch(/poetic mirror, not a metadata report/);
    expect(systemText).toMatch(/display_distillation/);
    expect(systemText).toMatch(/visible_anchors/);
    expect(systemText).toMatch(/symbol_stances: 1–5 items, only for genuinely charged symbols/);
    expect(systemText).toMatch(/maximum 5/);
    expect(systemText).toMatch(/SOURCE BOUNDARY/);
    expect(systemText).toMatch(/ARCHETYPAL ECHOES/);
    expect(systemText).toMatch(/Return 0–2 optional archetypal functions from the supplied closed catalog/);
    expect(systemText).toMatch(/MOTIFS \/ DREAM MOTIFS/);
    expect(systemText).toMatch(/Select 0–1 mythic narrative/);
    expect(systemText).toMatch(/core_mode.*null/);
    expect(userMsg).toMatch(/Catalog this dream into pattern metadata and immediate UI display distillation after the final interpretation/);
    expect(userMsg).toMatch(/Final interpretation:/);
    expect(userMsg).toMatch(/red door carries the strongest pressure/);
    expect(userMsg).not.toMatch(/3–5 items/);
    expect(extraction.display_distillation?.dominant_lens).toBe('threshold');
    expect(extraction.display_distillation?.visible_anchors).toHaveLength(5);
    expect(extraction.display_distillation?.visible_anchors.map((anchor) => anchor.label)).toEqual([
      'red door',
      'wanting entry',
      'blocked handle',
      'frustration',
      'waiting outside',
    ]);
    expect(extraction.display_distillation?.visible_anchors[0].type).toBe('threshold');
    expect(extraction.display_distillation?.visible_anchors[0].ui_meaning.length).toBeLessThanOrEqual(141);
    expect(extraction.display_distillation?.visible_anchors[0].ui_meaning).toMatch(/…$/);
    expect(extraction.display_distillation?.visible_anchors[4].type).toBe('archetypal_echo');
    expect(extraction.display_distillation?.dream_movement).toBe('approaching');
    expect(extraction.display_distillation?.main_tension).toBe('closed door vs wanting entry');
    expect(extraction.display_distillation?.main_tension).toBe(extraction.central_conflicts[0]);
  });

  it('returns empty extraction instead of leaking malformed JSON into flows', async () => {
    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [
          {
            message: {
              content: 'not valid json',
            },
            finish_reason: 'stop',
          },
        ],
      })
    );

    const extraction = await extractDreamSymbolsAndArchetypes(dreamFixture(), 'A reading.');

    expect(extraction).toEqual({
      display_distillation: undefined,
      symbols: [],
      archetypes: [],
      landscapes: [],
      affects: [],
      motifs: [],
      relational_dynamics: [],
      thresholds: [],
      central_conflicts: [],
      core_mode: null,
      amplifications: [],
      symbol_stances: [],
    });
  });

  it('keeps symbol stances when raw extraction uses the symbolStances alias', async () => {
    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                display_distillation: {
                  essence_title: 'Guarded entry',
                  essence_line: 'The dream gathers around a guarded threshold.',
                  dominant_lens: 'threshold',
                  visible_anchors: [],
                  main_tension: 'entry vs hesitation',
                  dream_movement: 'approaching',
                  movement_line: 'Something approaches without crossing.',
                },
                symbols: ['red door'],
                symbolStances: [{ symbol: 'red door', stance: 'blocked, charged' }],
                archetypes: [],
                landscapes: [],
                affects: ['tension'],
                motifs: [],
                relational_dynamics: [],
                thresholds: ['closed door'],
                central_conflicts: ['entry vs hesitation'],
                core_mode: 'Core Tension',
                amplifications: [],
              }),
            },
            finish_reason: 'stop',
          },
        ],
      })
    );

    const extraction = await extractDreamSymbolsAndArchetypes(dreamFixture(), 'A reading.');

    expect(extraction.symbol_stances).toEqual([
      { symbol: 'red door', stance: 'blocked, charged' },
    ]);
  });

  it('includes the same universal output-language instruction for non-Greek dreams', async () => {
    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [
          {
            message: { content: editorialArcResponse('Analyse', 'fr') },
            finish_reason: 'stop',
          },
        ],
      })
    );

    await generateInitialInterpretation(
      {
        id: '1',
        title: 'Rêve',
        date: '2024-01-01',
        content: "J'ai rêvé d'une forêt et d'un chemin qui montait vers une lumière douce.",
        archived: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      { depth: 'standard' }
    );

    const interpretationBody = JSON.parse(mockFetch.mock.calls.at(-1)?.[1]?.body as string);
    const userMsg = interpretationBody.messages.find((m: { role: string }) => m.role === 'user')?.content ?? '';
    expect(userMsg).toMatch(/OUTPUT LANGUAGE/);
    expect(userMsg).not.toMatch(/Ελληνικά/);
  });

  it('uses the hidden-structure standard prompt', async () => {
    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [
          {
            message: { content: editorialArcResponse('Standard analysis') },
            finish_reason: 'stop',
          },
        ],
      })
    );

    await generateInitialInterpretation(
      {
        id: '1',
        title: 'Door',
        date: '2024-01-01',
        content: 'I was in a hallway watching a closed blue door.',
        archived: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      { depth: 'standard' }
    );

    const interpretationBody = JSON.parse(mockFetch.mock.calls.at(-1)?.[1]?.body as string);
    expect(interpretationBody.max_completion_tokens).toBe(1600);
    expect(interpretationBody.temperature).toBe(0.55);
    const systemText = interpretationBody.messages
      .filter((m: { role: string }) => m.role === 'system')
      .map((m: { content: string }) => m.content)
      .join('\n');
    expect(systemText).toMatch(/one compact path through the dream, not exhaustive/);
    expect(systemText).toMatch(/## Dream Movement/);
    expect(systemText).toMatch(/Write one compact interpretive reading in as many short paragraphs as its/);
    expect(systemText).toMatch(/Do not split the reading into multiple analytical sections/);
    expect(systemText).toMatch(/Do not use bullets for symbols/);
    expect(systemText).toMatch(/Do not use headings for Emotional Atmosphere, Key Symbols, Possible Psychological Meaning, Symbolic Movement, or Integration/);
    expect(systemText).toMatch(/Mythic or archetypal widening is normally out of scope in Standard mode/);
    expect(systemText).toMatch(/at most one brief image-born resonance sentence/);
    expect(systemText).toMatch(/Do not force mythology onto domestic, ordinary, comic, bureaucratic, or psychologically local dreams/);
    expect(systemText).toMatch(/Prefer resonance over explanation/);
    expect(systemText).not.toMatch(/## Emotional Atmosphere/);
    expect(systemText).not.toMatch(/## Key Symbols/);
    expect(systemText).not.toMatch(/## Possible Psychological Meaning/);
    expect(systemText).not.toMatch(/## Mythic Resonance/);
    expect(systemText).toMatch(/Typical density may fall around 140–360 words, but this is telemetry/);
    expect(systemText).toMatch(/## Reflective Questions/);
    expect(systemText).toMatch(/Exactly 2 questions as markdown bullets/);
  });

  it('uses the image-near quick prompt', async () => {
    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [
          {
            message: { content: editorialArcResponse('Quick analysis') },
            finish_reason: 'stop',
          },
        ],
      })
    );

    await generateInitialInterpretation(
      {
        id: '1',
        title: 'Window',
        date: '2024-01-01',
        content: 'A window opened by itself and cold air came in.',
        archived: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      { depth: 'quick' }
    );

    const interpretationBody = JSON.parse(mockFetch.mock.calls.at(-1)?.[1]?.body as string);
    expect(interpretationBody.max_completion_tokens).toBe(560);
    expect(interpretationBody.temperature).toBe(0.68);
    const systemText = interpretationBody.messages
      .filter((m: { role: string }) => m.role === 'system')
      .map((m: { content: string }) => m.content)
      .join('\n');
    expect(systemText).toMatch(/No headings/);
    expect(systemText).toMatch(/Offer a glimpse: one concrete image or action, its atmosphere, and one central/);
    expect(systemText).toMatch(/A felt-sense sentence belongs only when bodily tone is genuinely central/);
    expect(systemText).toMatch(/Do not manufacture a problem when the dream is calm/);
    expect(systemText).toMatch(/Do not use archetype labels, amplifications, or extra framework language/);
    expect(systemText).toMatch(/Roughly 70–160 words is guidance/);
    expect(systemText).toMatch(/exactly one natural reflective question/);
    expect(systemText).not.toMatch(/## Reflective Questions/);
    expect(systemText).not.toMatch(/ONEIROS EDITORIAL ARC/);
    expect(systemText).not.toMatch(/psychological aliveness v1\.4\.0/);
  });

  it('uses the hidden-structure advanced prompt', async () => {
    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [
          {
            message: { content: editorialArcResponse('Advanced analysis') },
            finish_reason: 'stop',
          },
        ],
      })
    );

    await generateInitialInterpretation(
      {
        id: '1',
        title: 'Gate',
        date: '2024-01-01',
        content: 'I stood before a gate that felt old and bright.',
        archived: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      { depth: 'advanced' }
    );

    const interpretationBody = JSON.parse(mockFetch.mock.calls.at(-1)?.[1]?.body as string);
    expect(interpretationBody.max_completion_tokens).toBe(2700);
    expect(interpretationBody.temperature).toBe(0.6);
    const systemText = interpretationBody.messages
      .filter((m: { role: string }) => m.role === 'system')
      .map((m: { content: string }) => m.content)
      .join('\n');
    expect(systemText).not.toMatch(/Mythic resonance note/);
    expect(systemText).toMatch(/Linger longer, not explain more/);
    expect(systemText).toMatch(/Depth is increased resolution inside the/);
    expect(systemText).toMatch(/Stay with a charged image before interpreting it/);
    expect(systemText).toMatch(/Advanced is permission for depth, not a length/);
    expect(systemText).toMatch(/When a dream image carries unmistakable mythic, archetypal, ritual, initiatory, underworld, cosmic, sacred, or transpersonal weight/);
    expect(systemText).toMatch(/Mythic resonance must emerge organically from the image itself, not from symbolic inflation/);
    expect(systemText).toMatch(/Do not force mythology onto domestic, ordinary, comic, bureaucratic, or psychologically local dreams/);
    expect(systemText).toMatch(/A single precise mythic echo is stronger than extended amplification/);
    expect(systemText).toMatch(/Prefer resonance over explanation/);
    expect(systemText).toMatch(/Do not create a Mythic Resonance section/);
    expect(systemText).toMatch(/Do not create a Mythic Resonance section or lecture on mythology/);
    expect(systemText).toMatch(/## Dream Movement/);
    expect(systemText).toMatch(/Write one continuous interpretive essay in as many short paragraphs as the/);
    expect(systemText).toMatch(/without naming these as subheadings/);
    expect(systemText).toMatch(/Do not split the reading into multiple analytical sections/);
    expect(systemText).toMatch(/Let one image become the gravitational center/);
    expect(systemText).toMatch(/Trust the image/);
    expect(systemText).toMatch(/## Reflective Questions/);
    expect(systemText).not.toMatch(/## The Charged Image/);
    expect(systemText).not.toMatch(/## What the Dream Organizes/);
    expect(systemText).not.toMatch(/## Symbolic Movement/);
    expect(systemText).not.toMatch(/## What Remains Unresolved/);
    expect(systemText).not.toMatch(/## Deeper Dynamics/);
    expect(systemText).not.toMatch(/## Mythic Resonance/);
    expect(systemText).toMatch(/Under the chosen Core heading, write 1–2 image-near sentences/);
    expect(systemText).toMatch(/without sounding like a diagnosis/);
    expect(systemText).toMatch(/Do not use archetype labels here/);
    expect(systemText).toMatch(/Let unresolvedness appear only if the dream itself leaves something suspended/);
    expect(systemText).toMatch(/Roughly 250–400 words may be enough for a small but numinous dream/);
    expect(systemText).toMatch(/complex\s+multi-scene material may earn 650–800/);
    expect(systemText).toMatch(/Exactly 2 questions as markdown bullets/);
    expect(systemText).not.toMatch(/ONEIROS EDITORIAL ARC/);
    expect(systemText).not.toMatch(/Return zero or one question/);
    expect(systemText).not.toMatch(/Silence is a valid editorial ending/);
    expect(systemText).not.toMatch(/Never leave a gap or\s+withhold an interpretation merely to manufacture a question/);
    expect(systemText).not.toMatch(/psychological aliveness v1\.4\.0/);
    const userMsg = interpretationBody.messages.find((m: { role: string }) => m.role === 'user')?.content ?? '';
    expect(userMsg).toMatch(/Return to the dream sequence and specific images first/);
    expect(userMsg).toMatch(/Do not organize the reading around categories, tags, or frameworks/);
    expect(userMsg).toMatch(/Follow the one or two images with the\s+strongest specific gravity/);
    expect(userMsg).toMatch(/actual movement they create/);
    expect(userMsg).toMatch(/Do not give\s+conclusions/);
    expect(userMsg).not.toMatch(/Extracted/);
    expect(userMsg).not.toMatch(/metadata/);
    expect(userMsg).not.toMatch(/larger symbolic forms or imaginal structures/);
    expect(userMsg).not.toMatch(/Archetypal dynamics only when unmistakably present/);
  });

  it('uses the compact advanced retry prompt when advanced output is truncated', async () => {
    mockFetch
      .mockResolvedValueOnce(
        apiResponse({
          choices: [
            {
              message: { content: 'Partial advanced analysis' },
              finish_reason: 'length',
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        apiResponse({
          choices: [
            {
              message: { content: editorialArcResponse('Compact advanced analysis') },
              finish_reason: 'stop',
            },
          ],
        })
      );

    const result = await generateInitialInterpretation(
      {
        id: '1',
        title: 'Kitchen',
        date: '2024-01-01',
        content: 'I was in a narrow kitchen while someone spoke a language I could not understand.',
        archived: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      { depth: 'advanced' }
    );

    expect(result).toBe('Compact advanced analysis');
    const retryBody = JSON.parse(mockFetch.mock.calls.at(-1)?.[1]?.body as string);
    expect(retryBody.max_completion_tokens).toBe(1900);
    const retrySystemText = retryBody.messages
      .filter((m: { role: string }) => m.role === 'system')
      .map((m: { content: string }) => m.content)
      .join('\n');
    expect(retrySystemText).toMatch(/Rewrite from scratch/);
    expect(retrySystemText).toMatch(/Use only one Core heading, Dream Movement, and Reflective Questions/);
    expect(retrySystemText).toMatch(/Linger only where the dream earns greater resolution/);
    expect(retrySystemText).toMatch(/Stay with the strongest specific dream details/);
    expect(retrySystemText).toMatch(/required reflective question/);
    expect(retrySystemText).toMatch(/never by a second question call/);
    expect(retrySystemText).not.toMatch(/fresh private question-or-no-question envelope first/);
    expect(retrySystemText).not.toMatch(/Never repair or reuse the\s+previous envelope/);
  });

  it('attaches proxy task keys and dream headers for reflection depths and compact retry', async () => {
    mockFetch
      .mockResolvedValueOnce(
        apiResponse({
          choices: [{ message: { content: editorialArcResponse('Quick') }, finish_reason: 'stop' }],
        })
      )
      .mockResolvedValueOnce(
        apiResponse({
          choices: [{ message: { content: editorialArcResponse('Standard') }, finish_reason: 'stop' }],
        })
      )
      .mockResolvedValueOnce(
        apiResponse({
          choices: [{ message: { content: 'Partial advanced' }, finish_reason: 'length' }],
        })
      )
      .mockResolvedValueOnce(
        apiResponse({
          choices: [{ message: { content: editorialArcResponse('Retry') }, finish_reason: 'stop' }],
        })
      );
    const ai = await loadAiWithProxyEndpoint();

    await ai.generateInitialInterpretation(dreamFixture(), { depth: 'quick' });
    await ai.generateInitialInterpretation(dreamFixture(), { depth: 'standard' });
    await ai.generateInitialInterpretation(dreamFixture(), { depth: 'advanced' });

    const bodies = mockFetch.mock.calls.map((call) => JSON.parse(call[1]?.body as string));
    expect(bodies.map((body) => body.task)).toEqual([
      'interpretation_quick',
      'interpretation_standard',
      'interpretation_advanced',
      'interpretation_retry_compact',
    ]);
    expect(mockFetch.mock.calls.map((call) => call[1]?.headers?.['X-Dream-Id'])).toEqual([
      'dream-1',
      'dream-1',
      'dream-1',
      'dream-1',
    ]);
  });

  it('attaches proxy task keys for extraction, chat, conversation updates, pattern essays, and semantic grouping', async () => {
    mockFetch
      .mockResolvedValueOnce(
        apiResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  display_distillation: {
                    essence_title: 'Guarded entry',
                    essence_line: 'The dream gathers around a guarded threshold.',
                    dominant_lens: 'threshold',
                    visible_anchors: [
                      { label: 'red door', type: 'threshold', salience: 5, ui_meaning: 'a guarded point of entry' },
                    ],
                    main_tension: 'entry vs protection',
                    dream_movement: 'approaching',
                    movement_line: 'Something approaches without crossing.',
                  },
                  symbols: ['red door'],
                  symbol_stances: [{ symbol: 'red door', stance: 'blocking, charged' }],
                  archetypes: [],
                  landscapes: ['hallway'],
                  affects: ['tension'],
                  motifs: ['blocked threshold'],
                  relational_dynamics: ['distance at entry'],
                  thresholds: ['closed door'],
                  central_conflicts: ['wanting entry vs blocked door'],
                  core_mode: 'Core Tension',
                  amplifications: [],
                }),
              },
              finish_reason: 'stop',
            },
          ],
        })
      )
      .mockResolvedValueOnce(apiResponse({
        choices: [{
          message: {
            content: JSON.stringify({
              answer: 'The guarded door keeps the next movement close to its threshold.',
              output_language: 'en',
              reply_mode: 'meaning_request',
            }),
          },
          finish_reason: 'stop',
        }],
      }))
      .mockResolvedValueOnce(
        apiResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  archetypes: [{ canonical_label: 'Shadow', expression: '', resonance: '', evidence: [] }],
                  affects: ['tension'],
                  motifs: ['blocked threshold'],
                  relational_dynamics: ['distance at entry'],
                  thresholds: ['closed door'],
                  central_conflicts: ['wanting entry vs blocked door'],
                  core_mode: 'Core Tension',
                  amplifications: [],
                }),
              },
              finish_reason: 'stop',
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        apiResponse({
          choices: [{ message: { content: 'Essay\n\n<!--END_DREAM_ESSAY-->' }, finish_reason: 'stop' }],
        })
      )
      .mockResolvedValueOnce(
        apiResponse({
          choices: [{ message: { content: 'Recent\n\n<!--END_DREAM_ESSAY-->' }, finish_reason: 'stop' }],
        })
      )
      .mockResolvedValueOnce(
        apiResponse({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  symbol_groups: [{ canonical: 'forest', members: ['forest', 'woods'] }],
                  landscape_groups: [{ canonical: 'hallway', members: ['hallway', 'corridor'] }],
                }),
              },
              finish_reason: 'stop',
            },
          ],
        })
      );
    const ai = await loadAiWithProxyEndpoint();
    const dream = dreamFixture();
    const interpretation: Interpretation = {
      id: 'interpretation-1',
      dreamId: dream.id,
      messages: [{ id: 'm1', role: 'assistant', content: 'A reading.', timestamp: 't' }],
      symbols: ['red door'],
      archetypes: [],
      createdAt: 't',
      updatedAt: 't',
    };

    await ai.extractDreamSymbolsAndArchetypes(dream, 'A reading.');
    await ai.sendChatMessage(dream, [{ id: 'm1', role: 'assistant', content: 'A reading.', timestamp: 't' }], 'What next?');
    await ai.updateInterpretationElementsFromConversation(dream, interpretation, [
      { id: 'm1', role: 'assistant', content: 'A reading.', timestamp: 't' },
      { id: 'm2', role: 'user', content: 'The door felt guarded.', timestamp: 't' },
    ]);
    await ai.generatePatternInsights(
      [{ dreamId: dream.id, date: dream.date, extracted: { symbols: ['red door'], symbol_stances: [], archetypes: [], landscapes: [], affects: [], motifs: [], relational_dynamics: [], thresholds: [], central_conflicts: [], core_mode: null, amplifications: [] }, interpretation: 'A reading.' }],
      'monthly',
      'en'
    );
    await ai.generateRecentDreamFieldReflection(
      [{ dreamId: dream.id, date: dream.date, extracted: { symbols: ['red door'], symbol_stances: [], archetypes: [], landscapes: [], affects: [], motifs: [], relational_dynamics: [], thresholds: [], central_conflicts: [], core_mode: null, amplifications: [] }, interpretation: 'A reading.' }],
      'en'
    );
    await ai.groupSimilarTerms(['forest', 'woods'], ['hallway', 'corridor']);

    const bodies = mockFetch.mock.calls.map((call) => JSON.parse(call[1]?.body as string));
    expect(bodies.map((body) => body.task)).toEqual([
      'dream_extraction',
      'chat_followup',
      'conversation_element_update',
      'pattern_insights',
      'pattern_insights',
      'semantic_grouping',
    ]);
    expect(bodies[0].response_format).toEqual(buildDreamExtractionResponseFormat());
    expect(bodies[1].response_format).toBeUndefined();
    expect(bodies[2].response_format).toEqual({ type: 'json_object' });
    expect(bodies[5].response_format).toEqual({ type: 'json_object' });
  });

  it('attaches compact retry task for truncated pattern essays', async () => {
    mockFetch
      .mockResolvedValueOnce(
        apiResponse({
          choices: [{ message: { content: 'Partial essay' }, finish_reason: 'length' }],
        })
      )
      .mockResolvedValueOnce(
        apiResponse({
          choices: [{ message: { content: 'Compact essay\n\n<!--END_DREAM_ESSAY-->' }, finish_reason: 'stop' }],
        })
      );
    const ai = await loadAiWithProxyEndpoint();

    await ai.generatePatternInsights(
      [{ dreamId: 'dream-1', date: '2024-01-01', extracted: { symbols: ['door'], symbol_stances: [], archetypes: [], landscapes: [], affects: [], motifs: [], relational_dynamics: [], thresholds: [], central_conflicts: [], core_mode: null, amplifications: [] }, interpretation: 'A reading.' }],
      'monthly',
      'en'
    );

    const bodies = mockFetch.mock.calls.map((call) => JSON.parse(call[1]?.body as string));
    expect(bodies.map((body) => body.task)).toEqual(['pattern_insights', 'pattern_insights_retry_compact']);
  });

  it('runs one compact rewrite when a complete pattern essay exceeds its hard maximum', async () => {
    const overflowingEssay = `${Array.from({ length: 351 }, () => 'word').join(' ')}\n\n<!--END_DREAM_ESSAY-->`;
    mockFetch
      .mockResolvedValueOnce(
        apiResponse({
          choices: [{ message: { content: overflowingEssay }, finish_reason: 'stop' }],
        })
      )
      .mockResolvedValueOnce(
        apiResponse({
          choices: [
            {
              message: { content: 'Compact complete essay\n\n<!--END_DREAM_ESSAY-->' },
              finish_reason: 'stop',
            },
          ],
        })
      );
    const ai = await loadAiWithProxyEndpoint();

    const result = await ai.generatePatternInsights(
      [{ dreamId: 'dream-1', date: '2024-01-01', extracted: { symbols: ['door'], symbol_stances: [], archetypes: [], landscapes: [], affects: [], motifs: [], relational_dynamics: [], thresholds: [], central_conflicts: [], core_mode: null, amplifications: [] }, interpretation: 'A reading.' }],
      'monthly',
      'en'
    );

    const bodies = mockFetch.mock.calls.map((call) => JSON.parse(call[1]?.body as string));
    expect(bodies.map((body) => body.task)).toEqual([
      'pattern_insights',
      'pattern_insights_retry_compact',
    ]);
    expect(bodies[0].temperature).toBe(0.48);
    expect(bodies[1].temperature).toBe(0.35);
    expect(bodies[1].messages.at(-1)?.content).toMatch(/Rewrite the entire essay from scratch/);
    expect(result).toBe('Compact complete essay');
  });

  it('throws when API key missing', async () => {
    jest.resetModules();
    jest.doMock('expo-constants', () => ({
      expoConfig: { extra: { openaiApiKey: '' } },
    }));
    const { generateInitialInterpretation: generateWithMissingKey } = require('../src/services/ai');

    await expect(
      generateWithMissingKey({
        id: '1',
        title: 'Test',
        date: '2024-01-01',
        content: 'Dream text',
        archived: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      })
    ).rejects.toThrow(/OpenAI API key/);
  });

  it('formats rich archetypal and mythic echoes in the Phase 1 metadata context without object dumps', async () => {
    mockFetch.mockResolvedValueOnce(
      apiResponse({
        choices: [{ message: { content: 'Essay\n\n<!--END_DREAM_ESSAY-->' }, finish_reason: 'stop' }],
      })
    );
    const ai = await loadAiWithProxyEndpoint();

    await ai.generateRecentDreamFieldReflection(
      [
        {
          dreamId: 'dream-1',
          date: '2024-01-01',
          extracted: {
            symbols: ['thread'],
            symbol_stances: [],
            archetypes: [
              {
                canonical_label: 'Divine Child',
                expression: 'the guiding child at the end of the thread',
                resonance: 'A childlike figure carries orientation through the descent.',
                evidence: ['the girl directs the dreamer'],
              },
            ],
            landscapes: [],
            affects: [],
            motifs: [],
            relational_dynamics: [],
            thresholds: [],
            central_conflicts: [],
            core_mode: null,
            amplifications: [
              {
                title: 'Ariadne and the Labyrinth',
                tradition: 'Greek',
                resonance: 'A descent whose return stays unfinished.',
                divergence: 'No completed return is staged.',
                evidence: ['well', 'labyrinth'],
              },
            ],
          },
          interpretation: 'A reading.',
        },
      ],
      'en'
    );

    const body = JSON.parse(mockFetch.mock.calls[0]?.[1]?.body as string);
    const userText = body.messages.find((m: { role: string }) => m.role === 'user')?.content ?? '';
    expect(userText).not.toContain('Dream narrative excerpt:');
    expect(userText).toContain('Core Mode:');
    expect(userText).toContain('Archetypal Echoes:');
    expect(userText).toContain('Divine Child');
    expect(userText).toContain('Mythic Echoes:');
    expect(userText).toContain('Ariadne and the Labyrinth');
    expect(userText).not.toContain('[object Object]');
    expect(userText).not.toContain('"canonical_label"');
  });

  it('merges conversation element updates without changing dream symbols', () => {
    const merged = mergeConversationElementUpdates(
      {
        archetypes: [{ canonical_label: 'Shadow', expression: '', resonance: '', evidence: [] }],
        affects: ['tension'],
        motifs: ['blocked passage'],
        relational_dynamics: ['distance'],
        thresholds: ['entering work'],
        central_conflicts: ['autonomy vs belonging'],
        core_mode: 'Core Tension',
        amplifications: [{ title: '', tradition: '', resonance: 'threshold charge', divergence: '', evidence: [] }],
      },
      {
        archetypes: ['Shadow', 'Trickster', 'Unknown Archetype'] as any,
        motifs: ['blocked passage', 'playful evasion'],
        thresholds: ['entering work', 'needing shelter'],
        central_conflicts: ['autonomy vs paternal inclusion'],
        core_mode: 'Core Shift',
      }
    );

    expect(merged.archetypes.map((a) => a.canonical_label)).toEqual(['Shadow']);
    expect(merged.motifs).toEqual(['blocked passage', 'playful evasion']);
    expect(merged.thresholds).toEqual(['entering work', 'needing shelter']);
    expect(merged.central_conflicts).toEqual(['autonomy vs paternal inclusion']);
    expect(merged.affects).toEqual(['tension']);
    expect(merged.core_mode).toBe('Core Shift');
    expect(merged.amplifications).toEqual([
      { title: '', tradition: '', resonance: 'threshold charge', divergence: '', evidence: [] },
    ]);
  });

  it('derives a minimal display map from catalogued dream metadata', () => {
    const displayMap = buildDreamDisplayMap({
      symbols: ['kitchen', 'unknown language'],
      symbol_stances: [
        { symbol: 'kitchen', stance: 'tight, bodily pressure' },
        { symbol: 'unknown language', stance: 'unreadable demand' },
      ],
      archetypes: [],
      landscapes: ['kitchen'],
      affects: ['confusion'],
      motifs: ['unreadable speech'],
      relational_dynamics: [],
      thresholds: ['standing in narrow kitchen'],
      central_conflicts: ['tight kitchen vs unreadable language'],
      core_mode: 'Core Tension',
      amplifications: [{ title: '', tradition: '', resonance: 'language as pressure', divergence: '', evidence: [] }],
    });

    expect(displayMap).toEqual({
      chargedImages: [
        { label: 'kitchen', tone: 'tight, bodily pressure' },
        { label: 'unknown language', tone: 'unreadable demand' },
      ],
      movement: 'standing in narrow kitchen',
      unresolvedPressure: 'tight kitchen vs unreadable language',
      resonance: 'language as pressure',
    });
  });

});
