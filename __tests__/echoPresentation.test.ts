import {
  __testing,
  buildMythSynopsisCacheKey,
  catalogSynopsisTranslator,
  clearEchoPresentationCaches,
  formatArchetypalEchoesForDreamDetail,
  formatMythicEchoesForDreamDetail,
  localizeCatalogSynopsis,
  localizeTraditionLabel,
} from '../src/services/echoPresentation';

describe('echoPresentation', () => {
  beforeEach(() => {
    clearEchoPresentationCaches();
  });

  it('formats archetypes with casing, whitespace cleanup, and punctuation only', () => {
    const cards = formatArchetypalEchoesForDreamDetail(
      [
        {
          canonical_label: 'Guide / Psychopomp',
          expression: '  ο ηλικιωμένος   βαρκάρης στο ποτάμι ',
          resonance: ' κρατά το πέρασμα ανάμεσα στην απώλεια και την επιστροφή ',
          evidence: ['boatman'],
        },
      ],
      'Είδα έναν ηλικιωμένο βαρκάρη να με περνά από ποτάμι.'
    );

    expect(cards).toEqual([
      {
        title: 'The Guide / Psychopomp',
        body: 'Κρατά το πέρασμα ανάμεσα στην απώλεια και την επιστροφή.',
      },
    ]);
  });

  it('builds a natural Greek synopsis from canonical catalog content', () => {
    const synopsis = localizeCatalogSynopsis({
      mythCatalogVersion: '1.2.0',
      catalogId: 'greek.orpheus_eurydice',
      canonicalTitle: 'Orpheus and Eurydice',
      coreSynopsis:
        'living lover descends to retrieve dead beloved; conditional return granted; ascent under look-back prohibition; forbidden turn; irreversible second loss',
      targetLanguage: 'el',
    });

    expect(synopsis).toBe(
      'Ο Ορφέας κατεβαίνει για να ξαναφέρει την Ευρυδίκη από τον κόσμο των νεκρών. Η επιστροφή επιτρέπεται μόνο αν δεν κοιτάξει πίσω πριν βγουν στο φως, αλλά το απαγορευμένο γύρισμα φέρνει μια δεύτερη και οριστική απώλεια.'
    );
  });

  it('localizes tradition labels for Greek UI', () => {
    expect(localizeTraditionLabel('Greek mythology', 'el')).toBe('Ελληνική μυθολογία');
    expect(localizeTraditionLabel('Hebrew Bible / Tanakh', 'el')).toBe(
      'Εβραϊκή Βίβλος / Τανάκ'
    );
  });

  it('returns no archetype cards for empty archetypes', () => {
    expect(formatArchetypalEchoesForDreamDetail([], 'Ενα απλό όνειρο')).toEqual([]);
  });

  it('returns no myth cards for empty amplifications', () => {
    expect(formatMythicEchoesForDreamDetail([], 'Ενα απλό όνειρο')).toEqual([]);
  });

  it('omits only the divergence subsection when divergence is missing', () => {
    const cards = formatMythicEchoesForDreamDetail(
      [
        {
          catalog_id: 'greek.orpheus_eurydice',
          resonance: 'Υπάρχει κάθοδος για μια χαμένη αγαπημένη και όρος επιστροφής.',
          divergence: '',
          evidence: ['descent'],
          confidence: 'high',
        },
      ],
      'Κατεβαίνω σε υπόγειο για να βρω την αγαπημένη μου.'
    );

    expect(cards).toEqual([
      {
        title: 'Orpheus and Eurydice',
        subtitle: 'Ελληνική μυθολογία',
        body:
          'Ο Ορφέας κατεβαίνει για να ξαναφέρει την Ευρυδίκη από τον κόσμο των νεκρών. Η επιστροφή επιτρέπεται μόνο αν δεν κοιτάξει πίσω πριν βγουν στο φως, αλλά το απαγορευμένο γύρισμα φέρνει μια δεύτερη και οριστική απώλεια.\n\n' +
          'Στο όνειρό σου, υπάρχει κάθοδος για μια χαμένη αγαπημένη και όρος επιστροφής.',
      },
    ]);
  });

  it('omits only the myth synopsis when localization fails', () => {
    const cards = formatMythicEchoesForDreamDetail(
      [
        {
          catalog_id: 'sumerian.inanna_descent',
          resonance: 'Υπάρχει κάθοδος, αφαίρεση ισχύος και δύσκολη επιστροφή.',
          divergence: 'Δεν εμφανίζεται βασίλισσα του κάτω κόσμου.',
          evidence: ['descent'],
          confidence: 'high',
        },
      ],
      'Κατεβαίνω από πύλες και χάνω αντικείμενα.'
    );

    expect(cards).toEqual([
      {
        title: 'The Descent of Inanna',
        subtitle: 'Σουμεριακή / Μεσοποταμιακή παράδοση',
        body:
          'Στο όνειρό σου, υπάρχει κάθοδος, αφαίρεση ισχύος και δύσκολη επιστροφή. Ωστόσο, δεν εμφανίζεται βασίλισσα του κάτω κόσμου.',
      },
    ]);
  });

  it('falls back to expression when archetypal resonance is missing', () => {
    const cards = formatArchetypalEchoesForDreamDetail(
      [
        {
          canonical_label: 'Guide / Psychopomp',
          expression: '  ο ηλικιωμένος   βαρκάρης στο ποτάμι ',
          resonance: '',
          evidence: ['boatman'],
        },
      ],
      'Είδα έναν ηλικιωμένο βαρκάρη να με περνά από ποτάμι.'
    );

    expect(cards).toEqual([
      {
        title: 'The Guide / Psychopomp',
        body: 'Ο ηλικιωμένος βαρκάρης στο ποτάμι.',
      },
    ]);
  });

  it('isolates synopsis cache entries by catalog version', () => {
    const keyA = buildMythSynopsisCacheKey({
      mythCatalogVersion: '1.2.0',
      catalogId: 'greek.orpheus_eurydice',
      targetLanguage: 'el',
    });
    const keyB = buildMythSynopsisCacheKey({
      mythCatalogVersion: '1.3.0',
      catalogId: 'greek.orpheus_eurydice',
      targetLanguage: 'el',
    });

    expect(keyA).not.toBe(keyB);
  });

  it('does not mutate the persisted payload while composing cards', () => {
    const raw = [
      {
        catalog_id: 'greek.orpheus_eurydice',
        resonance: '  Υπάρχει κάθοδος για μια χαμένη αγαπημένη ',
        divergence: ' η επιστροφή δεν ολοκληρώνεται ',
        evidence: ['descent'],
        confidence: 'high' as const,
      },
    ];
    const before = JSON.parse(JSON.stringify(raw));

    formatMythicEchoesForDreamDetail(raw, 'Κατεβαίνω για να τη βρω.');

    expect(raw).toEqual(before);
  });

  it('passes only canonical synopsis inputs into synopsis localization', () => {
    const spy = jest.spyOn(catalogSynopsisTranslator, 'translate');

    localizeCatalogSynopsis({
      mythCatalogVersion: '1.2.0',
      catalogId: 'greek.orpheus_eurydice',
      canonicalTitle: 'Orpheus and Eurydice',
      coreSynopsis:
        'living lover descends to retrieve dead beloved; conditional return granted; ascent under look-back prohibition; forbidden turn; irreversible second loss',
      targetLanguage: 'en',
    });

    expect(spy).toHaveBeenCalledWith({
      mythCatalogVersion: '1.2.0',
      catalogId: 'greek.orpheus_eurydice',
      canonicalTitle: 'Orpheus and Eurydice',
      coreSynopsis:
        'living lover descends to retrieve dead beloved; conditional return granted; ascent under look-back prohibition; forbidden turn; irreversible second loss',
      targetLanguage: 'en',
    });
    expect(spy.mock.calls[0]?.[0]).not.toHaveProperty('dreamText');
    expect(spy.mock.calls[0]?.[0]).not.toHaveProperty('resonance');
    expect(spy.mock.calls[0]?.[0]).not.toHaveProperty('divergence');
    spy.mockRestore();
  });

  it('builds a flowing myth comparison paragraph with natural Greek guards', () => {
    expect(
      __testing.buildMythComparisonParagraph(
        'el',
        'Υπάρχει κάθοδος για μια χαμένη αγαπημένη και όρος επιστροφής.',
        'Η επιστροφή δεν ολοκληρώνεται.'
      )
    ).toBe(
      'Στο όνειρό σου, υπάρχει κάθοδος για μια χαμένη αγαπημένη και όρος επιστροφής. Ωστόσο, η επιστροφή δεν ολοκληρώνεται.'
    );

    expect(
      __testing.buildMythComparisonParagraph(
        'el',
        'Στο όνειρό σου, υπάρχει κάθοδος και όρος επιστροφής.',
        'Όμως η φωνή μένει ενεργή.'
      )
    ).toBe(
      'Στο όνειρό σου, υπάρχει κάθοδος και όρος επιστροφής. Όμως η φωνή μένει ενεργή.'
    );
  });
});
