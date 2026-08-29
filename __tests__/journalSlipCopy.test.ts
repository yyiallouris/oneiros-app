import {
  UNTITLED_JOURNAL_LEAD_MAX_CHARS,
  buildJournalSlipCopy,
  splitUntitledLead,
} from '../src/utils/journalSlipCopy';

const GREEK_UNTITLED =
  'Ημασταν στο σπίτι, μαζί με τον αδερφό μου, και από ένα δέντρο, στο μπαλκόνι. Έξω από το σπίτι ήταν ένας κήπος.';

describe('journalSlipCopy', () => {
  it('keeps an explicit title as a heading and the full dream as the excerpt', () => {
    const copy = buildJournalSlipCopy('The balcony', GREEK_UNTITLED);

    expect(copy.hasExplicitTitle).toBe(true);
    expect(copy.heading).toBe('The balcony');
    expect(copy.excerpt).toBe(GREEK_UNTITLED);
  });

  it('treats blank titles as untitled', () => {
    const copy = buildJournalSlipCopy('   ', 'A quiet hallway opened into water.');

    expect(copy.hasExplicitTitle).toBe(false);
    expect(copy.heading).toBe('A quiet hallway opened into water.');
    expect(copy.excerpt).toBe('');
  });

  it('splits untitled Greek on a word boundary so the body continues after a title ellipsis', () => {
    const copy = buildJournalSlipCopy(undefined, GREEK_UNTITLED);

    expect(copy.hasExplicitTitle).toBe(false);
    expect(copy.heading.endsWith('...')).toBe(true);
    expect(copy.heading.endsWith(' ')).toBe(false);
    expect(copy.excerpt.startsWith(' ')).toBe(false);
    expect(`${copy.heading.slice(0, -3)} ${copy.excerpt}`).toBe(GREEK_UNTITLED);
    expect(copy.heading.slice(0, -3).length).toBeLessThanOrEqual(UNTITLED_JOURNAL_LEAD_MAX_CHARS);
    expect(copy.heading).toMatch(/μου,\.\.\.$/);
    expect(copy.excerpt).toMatch(/^και από/);
  });

  it('does not cut a word in half or skip characters for the old 50-char ellipsis slice', () => {
    const copy = buildJournalSlipCopy('', GREEK_UNTITLED);

    expect(copy.heading).not.toMatch(/α\.\.\.$/);
    expect(copy.excerpt).not.toMatch(/^ρτο/);
    expect(copy.heading + copy.excerpt).not.toContain('α...ρτο');
  });

  it('does not add title ellipsis to an explicit title', () => {
    const copy = buildJournalSlipCopy('Balcony', 'A quiet hallway opened into water and then the sea.');

    expect(copy.heading).toBe('Balcony');
    expect(copy.heading.endsWith('...')).toBe(false);
  });

  it('keeps a short untitled dream as a single lead', () => {
    const copy = buildJournalSlipCopy(undefined, 'A red door.');

    expect(copy.heading).toBe('A red door.');
    expect(copy.excerpt).toBe('');
  });

  it('uses the whole first word when it is longer than the lead budget', () => {
    const longWord = 'υπερκατασκευασμένος';
    const preview = `${longWord} κήπος κάτω από το μπαλκόνι`;
    const { heading, excerpt } = splitUntitledLead(preview, 8);

    expect(heading).toBe(longWord);
    expect(excerpt).toBe('κήπος κάτω από το μπαλκόνι');
  });

  it('collapses whitespace before splitting', () => {
    const copy = buildJournalSlipCopy(
      undefined,
      '  Ημασταν   στο σπίτι,\nμαζί με τον αδερφό μου, και από ένα δέντρο.  '
    );

    expect(copy.heading).toBe('Ημασταν στο σπίτι, μαζί με τον αδερφό μου,...');
    expect(copy.excerpt.startsWith('και από')).toBe(true);
  });
});
