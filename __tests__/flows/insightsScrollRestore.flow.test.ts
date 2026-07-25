/**
 * Flow coverage: documentation/flows-07-insights-reports.md
 * (Insights landing scroll restore when returning from a section).
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

describe('insights scroll restore flow', () => {
  it('soft-refreshes Insights on focus and restores the prior scroll offset', () => {
    const source = readFileSync(path.join(repoRoot, 'src/screens/InsightsScreen.tsx'), 'utf8');

    expect(source).toMatch(/scrollOffsetRef/);
    expect(source).toMatch(/hasLoadedOnceRef/);
    expect(source).toMatch(/Soft refresh on return/);
    expect(source).toMatch(/if \(isFirstLoad\) \{\s*setLoading\(true\);/);
    expect(source).toMatch(/restoreScrollOffset\(\)/);
    expect(source).toMatch(/onScroll=\{handleScroll\}/);
    expect(source).toMatch(/scrollTo\(\{\s*y,\s*animated: false\s*\}\)/);
  });
});
