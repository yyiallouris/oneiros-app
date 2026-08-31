/**
 * Flow coverage: documentation/flows-04-dreams-journal-calendar.md
 * (Tab content and the Write Save CTA clear the floating shelf on every viewport).
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

describe('floating tab shelf clearance contract', () => {
  const writeScreen = read('src/screens/WriteScreen.tsx');
  const journalScreen = read('src/screens/JournalScreen.tsx');
  const insightsScreen = read('src/screens/InsightsScreen.tsx');
  const tabs = read('src/navigation/MainTabsNavigator.tsx');
  const layout = read('src/theme/layout.ts');
  const flowDoc = read('documentation/flows-04-dreams-journal-calendar.md');

  it('shares floating tab geometry between the nav shelf and the Save dock', () => {
    expect(layout).toMatch(/export const floatingTabBar/);
    expect(layout).toMatch(/export function resolveFloatingTabBarContentInset/);
    expect(layout).toMatch(/export function resolveFloatingTabBarBottom/);

    expect(tabs).toMatch(/resolveFloatingTabBarBottom\(insets\.bottom\)/);
    expect(tabs).toMatch(/height: floatingTabBar\.height/);
    expect(tabs).toMatch(/left: floatingTabBar\.horizontalInset/);

    expect(writeScreen).toMatch(/resolveFloatingTabBarContentInset\(insets\.bottom\)/);
    expect(writeScreen).toMatch(/testID="write-save-dock"/);
    expect(writeScreen).toMatch(/paddingBottom: saveDockBottomInset/);
    expect(journalScreen).toMatch(/resolveFloatingTabBarContentInset\(insets\.bottom\)/);
    expect(journalScreen).toMatch(/paddingBottom: listBottomInset/);
    expect(journalScreen).toMatch(/Math\.max\(spacing\.xl, insets\.top \+ spacing\.sm\)/);
    expect(insightsScreen).toMatch(/resolveFloatingTabBarContentInset\(insets\.bottom\)/);
    expect(insightsScreen).toMatch(/Math\.max\(spacing\.xl, insets\.top \+ spacing\.sm\)/);
  });

  it('keeps Save in the layout flow instead of overlaying the parchment nav', () => {
    expect(writeScreen).not.toMatch(/saveDock:\s*\{[^}]*position:\s*['"]absolute['"]/);
    expect(writeScreen).not.toMatch(/SAVE_BUTTON_NAV_GAP_OFFSET/);
    expect(writeScreen).not.toMatch(/MIN_FLOATING_TAB_BOTTOM_INSET/);
    expect(writeScreen).not.toMatch(/FLOATING_TAB_BAR_HEIGHT/);
    expect(writeScreen).toMatch(/WRITE_CARD_MIN_HEIGHT_COMPACT/);
    expect(writeScreen).toMatch(/flexGrow: 1/);
    expect(writeScreen).toMatch(/scrollContent: \{[\s\S]*flexGrow: 1/);

    expect(flowDoc).toMatch(/docks in the layout above the floating tab shelf/);
  });
});
