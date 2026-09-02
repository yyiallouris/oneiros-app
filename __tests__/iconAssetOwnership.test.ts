import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { ONEIROS_V1_CALENDAR_ICON_RELEASE } from '../src/theme';

const listFiles = (directory: string): string[] =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? listFiles(absolutePath).map((file) => path.join(entry.name, file))
        : [entry.name];
    })
    .sort();

const collectRuntimeSource = (directory: string): string[] =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return entry.name === 'legacy' ? [] : collectRuntimeSource(absolutePath);
      }
      return /\.(ts|tsx)$/.test(entry.name) ? [fs.readFileSync(absolutePath, 'utf8')] : [];
    });

describe('icon asset ownership', () => {
  it('keeps active icon directories limited to runtime-owned assets', () => {
    expect(listFiles('src/assets/icons/action_icons')).toEqual([
      'calendar_date_leaf_ink_v1.png',
      'mic_stop.png',
    ]);
    expect(listFiles('src/assets/icons/tab-icons')).toEqual([
      'insights_nav_eye_ink.png',
      'write_nav_ink_v2.png',
    ]);
    expect(listFiles('src/assets/icons/subscription')).toEqual([
      'oneiros_glyph_deeper.png',
      'oneiros_glyph_free.png',
      'oneiros_glyph_premium.png',
    ]);
    expect(listFiles('src/assets/icons/providers_icons')).toEqual([
      'apple.png',
      'discord.png',
      'google.png',
    ]);
    expect(listFiles('src/assets/icons/insights_section_icons')).toEqual([
      'oneiros_insight_dream_places_sheet_extract_rgba_900.png',
      'oneiros_insight_emotional_weather.png',
      'oneiros_insight_images_imaginal_eye_ink.png',
      'oneiros_insight_inner_tensions_sheet_extract_rgba_900.png',
      'oneiros_insight_repeating_patterns_sheet_extract_rgba_900.png',
      'oneiros_insight_thresholds_sheet_extract_rgba_900.png',
      'oneiros_isnights_archetypes.png',
      'pattern_recognition_essay/oneiros_period_reflection_v2.png',
    ]);
  });

  it('freezes the exact calendar artwork approved for Oneiros v1', () => {
    const assetPath = path.join(
      'src/assets/icons/action_icons',
      ONEIROS_V1_CALENDAR_ICON_RELEASE.assetFile,
    );
    const assetDigest = createHash('sha256').update(fs.readFileSync(assetPath)).digest('hex');

    expect(ONEIROS_V1_CALENDAR_ICON_RELEASE).toMatchObject({
      id: 'oneiros-calendar-date-leaf-v1.0.0',
      designRelease: 'oneiros-design-v1.0.1',
      status: 'final',
      approvedOn: '2026-09-02',
      assetFile: 'calendar_date_leaf_ink_v1.png',
      sourceCanvas: { width: 512, height: 512 },
      opticalSize: 31,
    });
    expect(assetDigest).toBe(ONEIROS_V1_CALENDAR_ICON_RELEASE.assetSha256);
  });

  it('never imports legacy artwork from runtime TypeScript', () => {
    const source = collectRuntimeSource('src').join('\n');

    expect(source).not.toMatch(/assets\/legacy\//);
    expect(source).not.toMatch(/assets\/icons\/legacy\//);
    expect(source).not.toMatch(/components\/icons\/generated\/legacy\//);
  });
});
