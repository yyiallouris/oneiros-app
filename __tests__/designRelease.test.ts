import fs from 'fs';
import { createHash } from 'crypto';
import { ONEIROS_V1_DESIGN_RELEASE } from '../src/theme';
import {
  computeDesignReleaseFingerprint,
  listDesignReleaseFiles,
  verifyDesignReleaseFingerprint,
} from '../scripts/lib/designReleaseFingerprint';

describe('Oneiros v1 design release', () => {
  it('locks the v1.3.0 visual foundation and defers icon redesign', () => {
    expect(ONEIROS_V1_DESIGN_RELEASE).toMatchObject({
      id: 'oneiros-design-v1.2.4',
      productLine: 'oneiros-v1',
      status: 'final',
      phaseOpenedOn: '2026-10-06',
      finalizedOn: '2026-10-07',
      appVersionAtApproval: '1.3.0',
      scope: 'complete-app-visual-ux',
      fingerprintAlgorithm: 'sha256-path-null-bytes-v1',
      activeCheckpoint: 'v1.3.0-d6.4-insights-mythic-parallels',
      reviewCheckpoint: null,
      sourceFingerprint: '26a795413dac902b9d42561e58b4c5af928321da5dd1f0bd4298ca41b10666aa',
      candidateSourceFingerprint: null,
    });

    expect(ONEIROS_V1_DESIGN_RELEASE.checkpoints).toEqual([
      expect.objectContaining({
        id: 'v1.3.0-d0-brand-baseline',
        status: 'approved',
        approvedOn: '2026-10-06',
        sourceFingerprint: '53b9930c80b1697f060ca6a3756a7c58ef517a6f6e607fcf581a72bc9d67f581',
      }),
      expect.objectContaining({
        id: 'v1.3.0-d1-navigation',
        status: 'approved',
        approvedOn: '2026-10-06',
        sourceFingerprint: '24450147e3fa2b8d104245ea6c5c8aa4753f695524da54434bcadefbeca0f980',
      }),
      expect.objectContaining({
        id: 'v1.3.0-d2-insights',
        label: 'Insights visual normalization only',
        status: 'reviewed',
        reviewedOn: '2026-10-06',
      }),
      expect.objectContaining({
        id: 'v1.3.0-d2.5-palette',
        label: 'Palette and colour-system definition',
        status: 'approved',
        approvedOn: '2026-10-07',
        sourceFingerprint: 'ccb14cde6e5716cd2843d96377dde5043cc49fa4023dae145a8cbe03d97cb775',
        directionApprovedOn: '2026-10-07',
        exactValuesStatus: 'final',
        candidateFingerprint: '0b0a2ff921f11f1f311e6479c1a90ccbc07fce0804824deb26a67027e37adbe2',
      }),
      expect.objectContaining({
        id: 'v1.3.0-d3-icons',
        label: 'Icon semantic and geometry diagnostic',
        status: 'diagnostic-approved-redesign-deferred',
        approvedOn: '2026-10-07',
        conceptExplorationAuthorizedOn: null,
        conceptCandidates: [],
        futurePhaseCandidates: ['emotional-atmosphere', 'period-reflection'],
      }),
      expect.objectContaining({
        id: 'v1.3.0-d4-screens',
        label: 'Texture and final polish',
        status: 'closed-not-required',
      }),
      expect.objectContaining({
        id: 'v1.3.0-d5-final',
        label: 'Visual Foundation Final Gate',
        status: 'approved',
        approvedOn: '2026-10-07',
        sourceFingerprint: 'ccb14cde6e5716cd2843d96377dde5043cc49fa4023dae145a8cbe03d97cb775',
        iconRedesignDeferred: true,
      }),
      expect.objectContaining({
        id: 'v1.3.0-d5.1-corrective',
        label: 'Paper coverage and Write date-chip corrective patch',
        status: 'approved',
        approvedOn: '2026-10-07',
        sourceFingerprint: '565633dfa5df701d0379d9051638a7d320acd48e0f7655dc252f2c7d915d7b0b',
        foundationDirectionChanged: false,
        iconRedesignDeferred: true,
      }),
      expect.objectContaining({
        id: 'v1.3.0-d6-dream-detail',
        label: 'Dream Detail hierarchy redesign',
        status: 'approved',
        approvedOn: '2026-10-07',
        sourceFingerprint: '38ee83c1933f645de7c87565fea7449968598085bd3a062bae09008b4f11d61c',
        foundationDirectionChanged: false,
        iconRedesignDeferred: true,
      }),
      expect.objectContaining({
        id: 'v1.3.0-d6.1-buttons',
        label: 'Shared button geometry corrective patch',
        status: 'approved',
        approvedOn: '2026-10-07',
        sourceFingerprint: '0122151b4ad719ddb8d59309135735551ae97e620205bd33bee53650fede49ae',
        foundationDirectionChanged: false,
        iconRedesignDeferred: true,
      }),
      expect.objectContaining({
        id: 'v1.3.0-d6.2-generation-loading',
        label: 'Generated-text loading visual normalization',
        status: 'approved',
        approvedOn: '2026-10-07',
        sourceFingerprint: '33633260b099fcb3b1a10d4cbf340cf7e02e6cf350766f3bc718f3888edb84b1',
        foundationDirectionChanged: false,
        iconRedesignDeferred: true,
      }),
      expect.objectContaining({
        id: 'v1.3.0-d6.3-insights-fabric-grouping',
        label: 'Insights Dream Fabric grouping correction',
        status: 'approved',
        approvedOn: '2026-10-07',
        sourceFingerprint: '51a5c1fdc786e633974d44000d2490adf64a63bbb829e0f696660b4f083bfcf6',
        foundationDirectionChanged: false,
        iconRedesignDeferred: true,
      }),
      expect.objectContaining({
        id: 'v1.3.0-d6.4-insights-mythic-parallels',
        label: 'Insights Mythic Parallels addition',
        status: 'approved',
        approvedOn: '2026-10-07',
        sourceFingerprint: '26a795413dac902b9d42561e58b4c5af928321da5dd1f0bd4298ca41b10666aa',
        foundationDirectionChanged: false,
        iconRedesignDeferred: true,
      }),
    ]);
  });

  it('matches the final visual-foundation fingerprint', () => {
    const files = listDesignReleaseFiles();

    expect(files).toContain('App.tsx');
    expect(files).toContain('src/navigation/MainTabsNavigator.tsx');
    expect(files).toContain('src/theme/colors.ts');
    expect(files).toContain('src/assets/icons/action_icons/calendar_date_leaf_ink_v1.png');
    expect(files.some((file) => file.includes('/legacy/'))).toBe(false);
    expect(files.some((file) => file.includes('/review/'))).toBe(false);
    expect(files.some((file) => file.split('/').some((segment) => segment.endsWith('-candidate')))).toBe(false);
    expect(files).toContain('assets/branding/releases/v1.3.0/manifest.json');
    expect(files).toContain('assets/branding/releases/v1.3.0/exports/icon-ios-1024.png');
    expect(computeDesignReleaseFingerprint()).toBe(ONEIROS_V1_DESIGN_RELEASE.sourceFingerprint);
    expect(ONEIROS_V1_DESIGN_RELEASE.sourceFingerprint).toBe(
      '26a795413dac902b9d42561e58b4c5af928321da5dd1f0bd4298ca41b10666aa',
    );
    expect(verifyDesignReleaseFingerprint().matches).toBe(true);
  });

  it('keeps the rejected conceptual D1 artwork outside runtime ownership', () => {
    const candidateRoot = 'assets/design-review/v1.3.0/d1-navigation-candidate';
    const manifest = JSON.parse(fs.readFileSync(`${candidateRoot}/manifest.json`, 'utf8')) as {
      checkpoint: string;
      status: string;
      runtime_import_allowed: boolean;
      assets: Record<string, string>;
    };

    expect(manifest).toMatchObject({
      checkpoint: 'v1.3.0-d1-navigation',
      status: 'rejected',
      runtime_import_allowed: false,
    });
    Object.entries(manifest.assets).forEach(([assetFile, expectedDigest]) => {
      const actualDigest = createHash('sha256')
        .update(fs.readFileSync(`${candidateRoot}/${assetFile}`))
        .digest('hex');
      expect(actualDigest).toBe(expectedDigest);
    });
    expect(listDesignReleaseFiles().some((file) => file.includes('d1-navigation-candidate'))).toBe(false);
    expect(ONEIROS_V1_DESIGN_RELEASE.activeCheckpoint).toBe('v1.3.0-d6.4-insights-mythic-parallels');
  });

  it('retains the exact normalization review artifact after D1 promotion', () => {
    const candidateRoot = 'assets/design-review/v1.3.0/d1-navigation-normalization-candidate';
    const manifest = JSON.parse(fs.readFileSync(`${candidateRoot}/manifest.json`, 'utf8'));

    expect(manifest).toMatchObject({
      checkpoint: 'v1.3.0-d1-navigation',
      status: 'approved',
      approved_on: '2026-10-06',
      scope: 'bottom-navigation-only',
      runtime_import_allowed: false,
      concepts_redesigned: false,
      review_artifact: 'index.html',
    });
    expect(
      createHash('sha256')
        .update(fs.readFileSync(`${candidateRoot}/${manifest.review_artifact}`))
        .digest('hex'),
    ).toBe(manifest.review_artifact_sha256);
    expect(manifest.promoted_source_fingerprint).toBe(
      '24450147e3fa2b8d104245ea6c5c8aa4753f695524da54434bcadefbeca0f980',
    );
    expect(ONEIROS_V1_DESIGN_RELEASE.activeCheckpoint).toBe('v1.3.0-d6.4-insights-mythic-parallels');
    expect(ONEIROS_V1_DESIGN_RELEASE.checkpoints[1]).toMatchObject({
      status: 'approved',
      sourceFingerprint: '24450147e3fa2b8d104245ea6c5c8aa4753f695524da54434bcadefbeca0f980',
      candidateFingerprint: '24450147e3fa2b8d104245ea6c5c8aa4753f695524da54434bcadefbeca0f980',
    });
  });

  it('keeps the reviewed D2 normalization sheet outside runtime', () => {
    const candidateRoot = 'assets/design-review/v1.3.0/d2-insights-normalization-candidate';
    const manifest = JSON.parse(fs.readFileSync(`${candidateRoot}/manifest.json`, 'utf8'));

    expect(manifest).toMatchObject({
      checkpoint: 'v1.3.0-d2-insights',
      status: 'reviewed',
      approved_on: null,
      reviewed_on: '2026-10-06',
      scope: 'insights-icon-normalization-only',
      runtime_import_allowed: false,
      concepts_redesigned: false,
      source_assets_modified: false,
      brand_master_modified: false,
      palette_modified: false,
      generative_art_used: false,
    });
    expect(Object.keys(manifest.semantic_identities)).toHaveLength(8);
    expect(
      createHash('sha256')
        .update(fs.readFileSync(`${candidateRoot}/${manifest.review_artifact}`))
        .digest('hex'),
    ).toBe(manifest.review_artifact_sha256);
    expect(listDesignReleaseFiles().some((file) => file.includes('d2-insights-normalization-candidate'))).toBe(false);
    expect(ONEIROS_V1_DESIGN_RELEASE).toMatchObject({
      activeCheckpoint: 'v1.3.0-d6.4-insights-mythic-parallels',
      reviewCheckpoint: null,
      candidateSourceFingerprint: null,
    });
  });

  it('retains the historical D2.5 candidate packet outside runtime', () => {
    const candidateRoot = 'assets/design-review/v1.3.0/d2-5-palette-definition-candidate';
    const manifest = JSON.parse(fs.readFileSync(`${candidateRoot}/manifest.json`, 'utf8'));

    expect(manifest).toMatchObject({
      checkpoint: 'v1.3.0-d2.5-palette',
      status: 'direction-approved-device-validation-candidate',
      approved_on: null,
      direction_approved_on: '2026-10-07',
      hex_values_approved: false,
      exact_hex_status: 'provisional-final-pending-native-device-check',
      candidate_runtime_integrated_on: '2026-10-07',
      device_validation_pending: true,
      scope: 'palette-definition-in-real-ui-context',
      palette_overhaul: false,
      runtime_import_allowed: false,
      runtime_tokens_modified: true,
      d2_runtime_imported: false,
      d3_redesign_authorized: false,
      logo_modified: false,
      icon_sources_modified: false,
      ui_structure_modified: false,
      icon_texture_added: false,
      purple_default_ink: false,
      generative_art_used: false,
      contexts: ['write', 'insights'],
      candidate_source_fingerprint: '0b0a2ff921f11f1f311e6479c1a90ccbc07fce0804824deb26a67027e37adbe2',
      current_roles: {
        background: '#F8F3EA',
        card: '#F3ECE2',
        primary_ink: '#2D2430',
        secondary_ink: '#5E5263',
        symbolic_ink: '#000000',
        active: '#4B3158',
        inactive: '#756A79',
        nav_surface: '#FFFDF9',
      },
      primitive_tokens: {
        PAPER: '#F3ECE2',
        SURFACE: '#FAF7F1',
        INK: '#342A38',
        INK_MUTED: '#6B606C',
        PLUM: '#5E4566',
        PLUM_SOFT: '#897B8C',
        BORDER: '#E4DCD2',
      },
      semantic_aliases: {
        background: 'PAPER',
        card: 'SURFACE',
        primary_text: 'INK',
        secondary_text: 'INK_MUTED',
        primary_icon_ink: 'INK',
        active_navigation: 'PLUM',
        inactive_navigation: 'PLUM_SOFT',
        muted_icon_ink: 'PLUM_SOFT',
        border: 'BORDER',
        divider: 'BORDER',
        nav_surface: 'SURFACE',
        logo: 'LOCKED_SOURCE',
      },
    });
    expect(Object.keys(manifest.primitive_tokens)).toHaveLength(7);
    expect(
      createHash('sha256')
        .update(fs.readFileSync(`${candidateRoot}/${manifest.review_artifact}`))
        .digest('hex'),
    ).toBe(manifest.review_artifact_sha256);
    expect(listDesignReleaseFiles().some((file) => file.includes('d2-5-palette-definition-candidate'))).toBe(false);
    expect(ONEIROS_V1_DESIGN_RELEASE).toMatchObject({
      activeCheckpoint: 'v1.3.0-d6.4-insights-mythic-parallels',
      reviewCheckpoint: null,
      candidateSourceFingerprint: null,
    });
  });

  it('keeps the D3 icon diagnostic evaluative and outside runtime', () => {
    const candidateRoot = 'assets/design-review/v1.3.0/d3-icon-diagnostic-candidate';
    const manifest = JSON.parse(fs.readFileSync(`${candidateRoot}/manifest.json`, 'utf8')) as {
      review_artifact: string;
      review_artifact_sha256: string;
      verdicts: Record<string, string>;
    };

    expect(manifest).toMatchObject({
      checkpoint: 'v1.3.0-d3-icons',
      status: 'approved-diagnostic',
      approved_on: '2026-10-07',
      scope: 'icon-semantics-and-geometry-diagnostic-only',
      runtime_import_allowed: false,
      runtime_modified: false,
      icon_assets_modified: false,
      icon_designs_produced: false,
      concepts_explored: false,
      verdicts_authorize_redesign: false,
      palette_checkpoint: 'v1.3.0-d2.5-palette-pending',
      palette_modified: false,
      generative_art_used: false,
    });
    expect(Object.values(manifest.verdicts)).toHaveLength(8);
    expect(Object.values(manifest.verdicts).filter((value) => value === 'keep-as-is')).toHaveLength(3);
    expect(Object.values(manifest.verdicts).filter((value) => value === 'needs-refinement')).toHaveLength(3);
    expect(
      Object.values(manifest.verdicts).filter((value) => value === 'conceptual-redesign-candidate'),
    ).toHaveLength(2);
    expect(
      createHash('sha256')
        .update(fs.readFileSync(`${candidateRoot}/${manifest.review_artifact}`))
        .digest('hex'),
    ).toBe(manifest.review_artifact_sha256);
    expect(listDesignReleaseFiles().some((file) => file.includes('d3-icon-diagnostic-candidate'))).toBe(false);
    expect(ONEIROS_V1_DESIGN_RELEASE).toMatchObject({
      activeCheckpoint: 'v1.3.0-d6.4-insights-mythic-parallels',
      reviewCheckpoint: null,
      candidateSourceFingerprint: null,
    });
  });

  it('locks the final gate artifact and records the browser/native boundary', () => {
    const reviewRoot = 'assets/design-review/v1.3.0/visual-foundation-final-gate';
    const manifest = JSON.parse(fs.readFileSync(`${reviewRoot}/manifest.json`, 'utf8'));

    expect(manifest).toMatchObject({
      checkpoint: 'v1.3.0-d5-final',
      status: 'approved-locked',
      approved_on: '2026-10-07',
      runtime_source_fingerprint: 'ccb14cde6e5716cd2843d96377dde5043cc49fa4023dae145a8cbe03d97cb775',
      runtime_import_allowed: false,
      visual_foundation_locked: true,
      icon_redesign_deferred: true,
      native_device_qa_executed: false,
      browser_qa: {
        write_and_insights: ['320x667', '360x800', '390x844', '430x932'],
        desktop_shell: '1440x900',
        horizontal_overflow: false,
        minimum_measured_target_dp: 44,
        write_320_cta_to_nav_clearance_dp: 25,
      },
    });
    expect(
      createHash('sha256')
        .update(fs.readFileSync(`${reviewRoot}/${manifest.review_artifact}`))
        .digest('hex'),
    ).toBe(manifest.review_artifact_sha256);
  });

  it('surfaces the approved design release and app version in Expo metadata', () => {
    const appConfig = fs.readFileSync('app.config.js', 'utf8');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as {
      version: string;
    };

    expect(packageJson.version).toBe(ONEIROS_V1_DESIGN_RELEASE.appVersionAtApproval);
    expect(appConfig).toContain(`version: '${ONEIROS_V1_DESIGN_RELEASE.appVersionAtApproval}'`);
    expect(appConfig).toContain(`designRelease: '${ONEIROS_V1_DESIGN_RELEASE.id}'`);
  });
});
