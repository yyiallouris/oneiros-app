import React from 'react';
import fs from 'fs';
import { render } from '@testing-library/react-native';
import { Image, StyleSheet } from 'react-native';
import { Path } from 'react-native-svg';
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
  it('preserves the original Oneiros microphone and calendar artwork', () => {
    const screen = render(
      <>
        <MicrophoneActionIcon testID="microphone" />
        <CalendarActionIcon testID="calendar" />
      </>,
    );
    const images = screen.UNSAFE_getAllByType(Image);
    const source = fs.readFileSync('src/components/icons/ActionIcons.tsx', 'utf8');

    expect(images).toHaveLength(2);
    expect(source).toContain("action_icons/mic_play.png");
    expect(source).toContain("action_icons/calendar_icon.png");
    expect(source).not.toContain("action_icons/mic_play_bold.png");
    expect(source).not.toContain("action_icons/calendar_icon_bold.png");
    expect(images[0].props.resizeMode).toBe('contain');
    expect(images[1].props.resizeMode).toBe('contain');
    expect(StyleSheet.flatten(images[0].props.style).tintColor).toBeUndefined();
    expect(StyleSheet.flatten(images[1].props.style).tintColor).toBeUndefined();
  });

  it('keeps the original quiet canvas proportions instead of force-cropping the artwork', () => {
    const screen = render(
      <>
        <MicrophoneActionIcon testID="microphone" />
        <CalendarActionIcon testID="calendar" />
      </>,
    );

    expect(StyleSheet.flatten(screen.getByTestId('microphone').props.style).width).toBe(29);
    expect(StyleSheet.flatten(screen.getByTestId('calendar').props.style).width).toBe(30);
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
