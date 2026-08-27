import { EditRevisionGuard } from '../src/utils/editRevisionGuard';

describe('EditRevisionGuard', () => {
  it('rejects delayed hydration after the user has typed', async () => {
    const guard = new EditRevisionGuard();
    let visibleText = '';
    let resolveHydration!: (text: string) => void;
    const hydration = new Promise<string>((resolve) => { resolveHydration = resolve; });
    const token = guard.capture();
    const applyHydration = hydration.then((text) => {
      if (guard.isCurrent(token)) visibleText = text;
    });

    guard.markEdited();
    visibleText = 'what the user just typed';
    resolveHydration('stale persisted text');
    await applyHydration;

    expect(visibleText).toBe('what the user just typed');
  });
});
