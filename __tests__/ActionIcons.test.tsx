import React from 'react';
import { render } from '@testing-library/react-native';
import {
  CalendarActionIcon,
  MicrophoneActionIcon,
} from '../src/components/icons/ActionIcons';

describe('action icons', () => {
  it('uses the bold variants of the original Oneiros artwork', () => {
    const screen = render(
      <>
        <MicrophoneActionIcon testID="microphone" />
        <CalendarActionIcon testID="calendar" />
      </>,
    );

    expect(screen.getByTestId('microphone').props.source).toBe(
      require('../src/assets/icons/action_icons/mic_play_bold.png'),
    );
    expect(screen.getByTestId('calendar').props.source).toBe(
      require('../src/assets/icons/action_icons/calendar_icon_bold.png'),
    );
  });

  it('renders the calendar slightly larger than the microphone by default', () => {
    const screen = render(
      <>
        <MicrophoneActionIcon testID="microphone" />
        <CalendarActionIcon testID="calendar" />
      </>,
    );

    expect(screen.getByTestId('microphone').props.style.width).toBe(29);
    expect(screen.getByTestId('calendar').props.style.width).toBe(32);
  });
});
