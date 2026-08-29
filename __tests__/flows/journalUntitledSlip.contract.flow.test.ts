/**
 * Flow coverage: documentation/flows-04-dreams-journal-calendar.md
 * (Journal untitled slips continue the opening line instead of a mid-word fake title).
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

describe('Journal untitled slip contract', () => {
  const journalScreen = read('src/screens/JournalScreen.tsx');
  const slipCopy = read('src/utils/journalSlipCopy.ts');
  const flowDoc = read('documentation/flows-04-dreams-journal-calendar.md');

  it('keeps untitled slips on the title-plus-excerpt hierarchy, with the excerpt continuing the title', () => {
    expect(journalScreen).toMatch(/buildJournalSlipCopy\(dream\.title, dream\.content\)/);
    expect(journalScreen).toMatch(/hasExplicitTitle/);
    expect(journalScreen).toMatch(/styles\.dreamTitle/);
    expect(journalScreen).toMatch(/styles\.dreamTitleContinuing/);
    expect(journalScreen).toMatch(/styles\.dreamPreview/);
    expect(journalScreen).toMatch(/ellipsizeMode=\{hasExplicitTitle \? 'tail' : 'clip'\}/);
    expect(journalScreen).not.toMatch(/untitledPreview/);
    expect(journalScreen).not.toMatch(/untitledLead/);
    expect(journalScreen).not.toMatch(/untitledContinuation/);

    expect(slipCopy).toMatch(/export function buildJournalSlipCopy/);
    expect(slipCopy).toMatch(/splitUntitledLead/);
    expect(slipCopy).toMatch(/withTitleEllipsis/);
    expect(slipCopy).toMatch(/findLastWordBreak/);
  });

  it('does not invent a 50-character ellipsis title from dream content', () => {
    expect(journalScreen).not.toMatch(/slice\(0,\s*50\)/);
    expect(journalScreen).not.toMatch(/\+ \(preview\.length > 50 \? '\.\.\.' : ''\)/);
    expect(journalScreen).not.toMatch(/preview\.slice\(displayTitle\.length\)/);
  });

  it('documents untitled continuation on the Journal archive slip', () => {
    expect(flowDoc).toMatch(/ending with `\.\.\.` so it still reads as a title/);
    expect(flowDoc).toMatch(/two-line excerpt that continues those words on a word boundary/);
  });

  it('renders each metadata marker as a separate Label: value capsule', () => {
    expect(journalScreen).toMatch(/<DreamMarker label="Image" value=\{symbolMarker\}/);
    expect(journalScreen).toMatch(/<DreamMarker label="Place" value=\{placeMarker\}/);
    expect(journalScreen).toMatch(/<DreamMarker label="Atmosphere" value=\{atmosphereMarker\}/);
    expect(journalScreen).toMatch(/style=\{styles\.markerPill\}/);
    expect(journalScreen).toMatch(/\{label\}: <\/Text>/);
    expect(journalScreen).not.toMatch(/image \/ \{symbolMarker\}/);
    expect(flowDoc).toMatch(/separate soft capsules using natural `Label: value` syntax/);
  });
});
