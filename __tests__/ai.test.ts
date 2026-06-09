import {
  buildDreamDisplayMap,
  extractDreamSymbolsAndArchetypes,
  generateInitialInterpretation,
  mergeConversationElementUpdates,
} from '../src/services/ai';

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

describe('ai service', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns interpretation when API succeeds', async () => {
    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [
          {
            message: { content: 'Analysis result\n\n<!--END_DREAM_READING-->' },
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
    expect(systemText).toMatch(/Do not infer archetypes unless strongly staged/);
    expect(systemText).toMatch(/core_mode.*null/);
    expect(userMsg).toMatch(/Catalog this dream into pattern metadata and immediate UI display distillation after the final interpretation/);
    expect(userMsg).toMatch(/Final interpretation:/);
    expect(userMsg).toMatch(/red door carries the strongest pressure/);
    expect(userMsg).toMatch(/maximum 5/);
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
    expect(extraction.display_distillation?.main_tension).toBe('entry vs blockage');
  });

  it('includes the same universal output-language instruction for non-Greek dreams', async () => {
    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [
          {
            message: { content: `Analyse\n\n<!--END_DREAM_READING-->` },
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
            message: { content: `Standard analysis\n\n<!--END_DREAM_READING-->` },
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
    expect(systemText).toMatch(/Use hidden structure/);
    expect(systemText).toMatch(/one compact path through the dream, not a report/);
    expect(systemText).toMatch(/## Dream Movement/);
    expect(systemText).toMatch(/Write this as one compact interpretive reading, 2–4 short paragraphs/);
    expect(systemText).toMatch(/without naming these as subheadings/);
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
  });

  it('uses the image-near quick prompt', async () => {
    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [
          {
            message: { content: `Quick analysis\n\n<!--END_DREAM_READING-->` },
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
    expect(interpretationBody.max_completion_tokens).toBe(550);
    expect(interpretationBody.temperature).toBe(0.68);
    const systemText = interpretationBody.messages
      .filter((m: { role: string }) => m.role === 'system')
      .map((m: { content: string }) => m.content)
      .join('\n');
    expect(systemText).toMatch(/No headings/);
    expect(systemText).toMatch(/one continuous image-near reflection, not a mini report/);
    expect(systemText).toMatch(/begin from one concrete dream image, action, place, figure, or bodily tone/);
    expect(systemText).toMatch(/follow one central psychological movement/);
    expect(systemText).toMatch(/Do not summarize the whole dream before entering it/);
    expect(systemText).toMatch(/Do not list symbols/);
    expect(systemText).toMatch(/Do not widen into mythic, archetypal, ritual, cosmic, sacred, or transpersonal framing/);
  });

  it('uses the hidden-structure advanced prompt', async () => {
    mockFetch.mockImplementation(async () =>
      apiResponse({
        choices: [
          {
            message: { content: `Advanced analysis\n\n<!--END_DREAM_READING-->` },
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
    expect(interpretationBody.max_completion_tokens).toBe(2200);
    expect(interpretationBody.temperature).toBe(0.6);
    const systemText = interpretationBody.messages
      .filter((m: { role: string }) => m.role === 'system')
      .map((m: { content: string }) => m.content)
      .join('\n');
    expect(systemText).not.toMatch(/Mythic resonance note/);
    expect(systemText).toMatch(/Use hypothetical language, but do not hide behind vagueness/);
    expect(systemText).toMatch(/allow clear symbolic landings when strongly grounded in dream details/);
    expect(systemText).toMatch(/allow the interpretation to land with precision instead of retreating into excessive neutrality/);
    expect(systemText).toMatch(/Do not emotionally flatten the strongest image/);
    expect(systemText).toMatch(/Do not reduce unusual dream details into generic symbolic categories/);
    expect(systemText).toMatch(/Preserve ambiguity without dissolving intensity/);
    expect(systemText).toMatch(/Some dream images carry disproportionate psychic weight/);
    expect(systemText).toMatch(/psychic gravity of images that change atmosphere/);
    expect(systemText).toMatch(/continuous movement through the dream-field, not a report/);
    expect(systemText).toMatch(/Use hidden structure/);
    expect(systemText).toMatch(/Let the dream sequence carry the form/);
    expect(systemText).toMatch(/Do not use phrases like "the dream organizes", "symbolic movement", or "charged image"/);
    expect(systemText).toMatch(/When a dream image carries unmistakable mythic, archetypal, ritual, initiatory, underworld, cosmic, sacred, or transpersonal weight/);
    expect(systemText).toMatch(/Mythic resonance must emerge organically from the image itself, not from symbolic inflation/);
    expect(systemText).toMatch(/Do not force mythology onto domestic, ordinary, comic, bureaucratic, or psychologically local dreams/);
    expect(systemText).toMatch(/A single precise mythic echo is stronger than extended amplification/);
    expect(systemText).toMatch(/Prefer resonance over explanation/);
    expect(systemText).toMatch(/Do not create a Mythic Resonance section/);
    expect(systemText).toMatch(/Do not lecture on mythology or explain archetypal systems/);
    expect(systemText).toMatch(/## Dream Movement/);
    expect(systemText).toMatch(/Write this as one continuous interpretive essay, 4–6 short paragraphs/);
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
    expect(systemText).toMatch(/Somatic questions should refer to the remembered dream-body or bodily tone/);
    expect(systemText).toMatch(/Length: aim for 550–800 words/);
    const userMsg = interpretationBody.messages.find((m: { role: string }) => m.role === 'user')?.content ?? '';
    expect(userMsg).toMatch(/Return to the dream sequence and charged images first/);
    expect(userMsg).toMatch(/Do not organize the reading around categories, tags, or frameworks/);
    expect(userMsg).toMatch(/The one or two images that carry the strongest charge/);
    expect(userMsg).toMatch(/What remains strange, unresolved, or not fully readable/);
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
              message: { content: `Compact advanced analysis\n\n<!--END_DREAM_READING-->` },
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
    expect(retryBody.max_completion_tokens).toBe(1800);
    const retrySystemText = retryBody.messages
      .filter((m: { role: string }) => m.role === 'system')
      .map((m: { content: string }) => m.content)
      .join('\n');
    expect(retrySystemText).toMatch(/Rewrite from scratch in 380–520 words/);
    expect(retrySystemText).toMatch(/Use the Advanced mode, but with hidden structure/);
    expect(retrySystemText).toMatch(/Only use the Core heading, Dream Movement, and Reflective Questions/);
    expect(retrySystemText).toMatch(/Do not use separate headings for Charged Image, What the Dream Organizes, Symbolic Movement, or What Remains Unresolved/);
    expect(retrySystemText).toMatch(/compact continuous movement through the dream sequence/);
    expect(retrySystemText).toMatch(/gravitational center without naming it as a section/);
    expect(retrySystemText).toMatch(/Stay close to the dream sequence/);
    expect(retrySystemText).toMatch(/Keep the strongest image partly alive before interpreting it/);
    expect(retrySystemText).toMatch(/Preserve ambiguity without dissolving intensity/);
    expect(retrySystemText).toMatch(/Avoid report-like language, therapeutic polish, archetype labels/);
    expect(retrySystemText).toMatch(/Allow brief mythic resonance only when it is unmistakably earned by the dream image itself/);
    expect(retrySystemText).toMatch(/Prefer one precise mythic echo over extended amplification/);
    expect(retrySystemText).toMatch(/Do not create a Mythic Resonance section or lecture on mythology/);
    expect(retrySystemText).not.toMatch(/Use the Advanced mode structure/);
    expect(retrySystemText).not.toMatch(/Let the remaining sections orbit the charged image/);
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

  it('merges conversation element updates without changing dream symbols', () => {
    const merged = mergeConversationElementUpdates(
      {
        archetypes: ['Shadow'],
        affects: ['tension'],
        motifs: ['blocked passage'],
        relational_dynamics: ['distance'],
        thresholds: ['entering work'],
        central_conflicts: ['autonomy vs belonging'],
        core_mode: 'Core Tension',
        amplifications: ['threshold charge'],
      },
      {
        archetypes: ['Shadow', 'Trickster', 'Unknown Archetype'],
        motifs: ['blocked passage', 'playful evasion'],
        thresholds: ['entering work', 'needing shelter'],
        central_conflicts: ['autonomy vs paternal inclusion'],
        core_mode: 'Core Shift',
      }
    );

    expect(merged.archetypes).toEqual(['Shadow', 'Trickster']);
    expect(merged.motifs).toEqual(['blocked passage', 'playful evasion']);
    expect(merged.thresholds).toEqual(['entering work', 'needing shelter']);
    expect(merged.central_conflicts).toEqual(['autonomy vs paternal inclusion']);
    expect(merged.affects).toEqual(['tension']);
    expect(merged.core_mode).toBe('Core Shift');
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
      amplifications: ['language as pressure'],
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
