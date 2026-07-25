/**
 * Flow coverage: documentation/flows-04-dreams-journal-calendar.md
 * DreamDetail initial load skeleton must match dream page + reflection summary,
 * not journal-list LinoSkeletonCard rows.
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

describe('dream detail skeleton flow', () => {
  it('uses DreamDetailSkeleton for initial load instead of dual LinoSkeletonCard', () => {
    const screen = read('src/screens/DreamDetailScreen.tsx');
    const skeleton = read('src/components/ui/DreamDetailSkeleton.tsx');
    const loadingDoc = read('src/theme/LOADING.md');
    const flowDoc = read('documentation/flows-04-dreams-journal-calendar.md');

    expect(screen).toMatch(/DreamDetailSkeleton/);
    expect(screen).toMatch(/isLoadingInitial/);
    expect(screen).not.toMatch(/LinoSkeletonCard/);

    expect(skeleton).toMatch(/Layout-faithful DreamDetail initial loader/);
    expect(skeleton).toMatch(/dreamPage/);
    expect(skeleton).toMatch(/reflectionSection/);
    expect(skeleton).toMatch(/essenceBlock/);
    expect(skeleton).toMatch(/anchorRow/);
    expect(skeleton).toMatch(/not journal-list LinoSkeletonCard/);

    expect(loadingDoc).toMatch(/DreamDetailSkeleton/);
    expect(flowDoc).toMatch(/DreamDetailSkeleton/);
    expect(flowDoc).toMatch(/Do \*\*not\*\* use journal-list `LinoSkeletonCard`/);
  });
});
