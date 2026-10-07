/**
 * Product-owner-approved Oneiros 1.3.0 design train.
 *
 * The brand masters are final, while the complete-app visual system advances
 * through explicit review checkpoints under the same marketing/design version.
 * `sourceFingerprint` identifies the locked visual-foundation source. Icon
 * redesign is explicitly outside this release and can reopen only as a future
 * phase with its own approval boundary.
 */
export const ONEIROS_V1_DESIGN_RELEASE = {
  id: 'oneiros-design-v1.1.0',
  productLine: 'oneiros-v1',
  status: 'final',
  phaseOpenedOn: '2026-10-06',
  finalizedOn: '2026-10-07',
  appVersionAtApproval: '1.3.0',
  scope: 'complete-app-visual-ux',
  fingerprintAlgorithm: 'sha256-path-null-bytes-v1',
  activeCheckpoint: 'v1.3.0-d5-final',
  reviewCheckpoint: null,
  sourceFingerprint: 'ccb14cde6e5716cd2843d96377dde5043cc49fa4023dae145a8cbe03d97cb775',
  candidateSourceFingerprint: null,
  checkpoints: [
    {
      id: 'v1.3.0-d0-brand-baseline',
      label: 'Approved brand and current-app baseline',
      status: 'approved',
      approvedOn: '2026-10-06',
      sourceFingerprint: '53b9930c80b1697f060ca6a3756a7c58ef517a6f6e607fcf581a72bc9d67f581',
    },
    {
      id: 'v1.3.0-d1-navigation',
      label: 'Bottom-navigation visual normalization only',
      status: 'approved',
      approvedOn: '2026-10-06',
      sourceFingerprint: '24450147e3fa2b8d104245ea6c5c8aa4753f695524da54434bcadefbeca0f980',
      candidateFingerprint: '24450147e3fa2b8d104245ea6c5c8aa4753f695524da54434bcadefbeca0f980',
    },
    {
      id: 'v1.3.0-d2-insights',
      label: 'Insights visual normalization only',
      status: 'reviewed',
      approvedOn: null,
      reviewedOn: '2026-10-06',
      sourceFingerprint: null,
    },
    {
      id: 'v1.3.0-d2.5-palette',
      label: 'Palette and colour-system definition',
      status: 'approved',
      approvedOn: '2026-10-07',
      sourceFingerprint: 'ccb14cde6e5716cd2843d96377dde5043cc49fa4023dae145a8cbe03d97cb775',
      directionApprovedOn: '2026-10-07',
      exactValuesStatus: 'final',
      candidateFingerprint: '0b0a2ff921f11f1f311e6479c1a90ccbc07fce0804824deb26a67027e37adbe2',
    },
    {
      id: 'v1.3.0-d3-icons',
      label: 'Icon semantic and geometry diagnostic',
      status: 'diagnostic-approved-redesign-deferred',
      approvedOn: '2026-10-07',
      conceptExplorationAuthorizedOn: null,
      conceptCandidates: [],
      futurePhaseCandidates: ['emotional-atmosphere', 'period-reflection'],
      sourceFingerprint: null,
    },
    {
      id: 'v1.3.0-d4-screens',
      label: 'Texture and final polish',
      status: 'closed-not-required',
      approvedOn: null,
      sourceFingerprint: null,
    },
    {
      id: 'v1.3.0-d5-final',
      label: 'Visual Foundation Final Gate',
      status: 'approved',
      approvedOn: '2026-10-07',
      sourceFingerprint: 'ccb14cde6e5716cd2843d96377dde5043cc49fa4023dae145a8cbe03d97cb775',
      iconRedesignDeferred: true,
    },
  ],
} as const;
