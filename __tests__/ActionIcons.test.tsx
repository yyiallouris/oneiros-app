import React from 'react';
import fs from 'fs';
import { render } from '@testing-library/react-native';
import { Image, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  CalendarActionIcon,
  ChevronDownActionIcon,
  CopyActionIcon,
  EditActionIcon,
  MicrophoneActionIcon,
  SearchActionIcon,
  SendActionIcon,
} from '../src/components/icons/ActionIcons';

describe('action icons', () => {
  it('uses pressure-led microphone paths and the textured calendar raster', () => {
    const screen = render(
      <>
        <MicrophoneActionIcon testID="microphone" />
        <CalendarActionIcon testID="calendar" />
      </>,
    );
    const source = fs.readFileSync('src/components/icons/ActionIcons.tsx', 'utf8');

    expect(screen.UNSAFE_getAllByType(Svg)).toHaveLength(1);
    expect(screen.UNSAFE_getAllByType(Image)).toHaveLength(1);
    expect(source).toContain("action_icons/calendar_date_leaf_ink_v1.png");
    expect(source).not.toContain("action_icons/mic_play_ink_v2.png");
    expect(source).not.toContain("action_icons/calendar_ink_v5.png");
    expect(source).not.toContain("action_icons/mic_play.png");
    expect(source).not.toContain("action_icons/calendar_icon.png");
    expect(source).not.toContain("action_icons/mic_play_bold.png");
    expect(source).not.toContain("action_icons/calendar_icon_bold.png");

    const microphonePaths = screen.getByTestId('microphone').findAllByType(Path);
    expect(microphonePaths).toHaveLength(7);
    expect(microphonePaths.map((path) => path.props.strokeWidth)).toEqual([
      1.9,
      2.55,
      1.7,
      1.85,
      1.45,
      1.75,
      1,
    ]);
    expect(microphonePaths[0].props.d).toMatch(/Z$/);
    expect(microphonePaths[1].props.opacity).toBe(0.16);
    expect(microphonePaths[6].props.opacity).toBe(0.32);

    const calendarStyle = StyleSheet.flatten(screen.getByTestId('calendar').props.style);
    expect(calendarStyle.tintColor).toBe('#5E5263');
    expect(fs.statSync('src/assets/icons/action_icons/calendar_date_leaf_ink_v1.png').size).toBeGreaterThan(1000);
  });

  it('uses pressure echoes without turning the microphone into a solid brush badge', () => {
    const screen = render(<MicrophoneActionIcon testID="microphone" />);
    const paths = screen.getByTestId('microphone').findAllByType(Path);
    const visibleWidths = paths
      .filter((path) => path.props.opacity == null)
      .map((path) => path.props.strokeWidth);
    const pressureEchoes = paths.filter((path) => path.props.opacity != null);

    expect(new Set(visibleWidths).size).toBeGreaterThan(2);
    expect(Math.max(...visibleWidths)).toBeLessThanOrEqual(1.9);
    expect(pressureEchoes.length).toBeGreaterThanOrEqual(2);
    pressureEchoes.forEach((path) => expect(path.props.opacity).toBeLessThanOrEqual(0.32));
  });

  it('gives the quiet functional marks equal optical frames', () => {
    const screen = render(
      <>
        <MicrophoneActionIcon testID="microphone" />
        <CalendarActionIcon testID="calendar" />
      </>,
    );

    expect(screen.getByTestId('microphone').props.width).toBe(31);
    expect(screen.getByTestId('microphone').props.height).toBe(31);
    const calendarStyle = StyleSheet.flatten(screen.getByTestId('calendar').props.style);
    expect(calendarStyle.width).toBe(31);
    expect(calendarStyle.height).toBe(31);
  });

  it('allows a semantic surface to override the shared muted ink', () => {
    const screen = render(
      <>
        <MicrophoneActionIcon testID="microphone" color="#4B3158" />
        <CalendarActionIcon testID="calendar" color="#4B3158" />
      </>,
    );

    screen.getByTestId('microphone').findAllByType(Path).forEach((path) => {
      expect(path.props.stroke).toBe('#4B3158');
    });
    expect(StyleSheet.flatten(screen.getByTestId('calendar').props.style).tintColor).toBe('#4B3158');
  });

  it('shares the same rounded stroke character across code-native functional icons', () => {
    const screen = render(
      <>
        <SearchActionIcon testID="search" />
        <EditActionIcon testID="edit" />
        <SendActionIcon testID="send" />
        <CopyActionIcon testID="copy" />
        <ChevronDownActionIcon testID="chevron" />
      </>,
    );

    screen.UNSAFE_getAllByType(Path).forEach((path) => {
      expect(path.props.strokeWidth).toBe(1.7);
      expect(path.props.strokeLinecap).toBe('round');
      expect(path.props.strokeLinejoin).toBe('round');
    });
  });
});
