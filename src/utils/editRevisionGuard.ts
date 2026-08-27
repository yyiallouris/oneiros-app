/**
 * Prevents delayed hydration reads from overwriting text entered after the
 * read began. The counter is intentionally synchronous: user input invalidates
 * every older token before any queued promise continuation can apply state.
 */
export class EditRevisionGuard {
  private revision = 0;

  capture(): number {
    return this.revision;
  }

  markEdited(): void {
    this.revision += 1;
  }

  isCurrent(token: number): boolean {
    return token === this.revision;
  }
}
