/**
 * Flow coverage: documentation/flows-07-insights-reports.md and documentation/flows-10-subscriptions-billing.md
 * (bottom scroll clearance for Insights surfaces and the premium upsell sheet).
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

describe('insights and paywall scroll flow', () => {
  it('pads scrollable bottoms so Insights content and the premium sheet can reach the end', () => {
    const insightsScreen = read('src/screens/InsightsScreen.tsx');
    const insightsSectionScreen = read('src/screens/InsightsSectionScreen.tsx');
    const premiumUpsellModal = read('src/components/subscription/PremiumUpsellModal.tsx');
    const insightsDoc = read('documentation/flows-07-insights-reports.md');
    const subscriptionDoc = read('documentation/flows-10-subscriptions-billing.md');

    expect(insightsScreen).toMatch(/useSafeAreaInsets/);
    expect(insightsScreen).toMatch(/paddingBottom:\s*spacing\.xxxl \+ insets\.bottom \+ spacing\.xxl/);

    expect(insightsSectionScreen).toMatch(/useSafeAreaInsets/);
    expect(insightsSectionScreen).toMatch(/paddingBottom:\s*spacing\.xxxl \+ insets\.bottom \+ spacing\.xxl/);

    expect(premiumUpsellModal).toMatch(/useSafeAreaInsets/);
    expect(premiumUpsellModal).toMatch(/paddingBottom:\s*spacing\.xxxl \+ insets\.bottom \+ spacing\.lg/);
    expect(premiumUpsellModal).toMatch(/keyboardShouldPersistTaps="handled"/);

    expect(insightsDoc).toMatch(/fully scrollable to the final rows/);
    expect(subscriptionDoc).toMatch(/The upsell sheet remains fully scrollable/);
  });
});
