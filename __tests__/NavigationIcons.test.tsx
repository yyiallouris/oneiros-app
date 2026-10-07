import React from 'react';
import { render } from '@testing-library/react-native';
import { Image, StyleSheet } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { InsightsTabIcon, JournalTabIcon, WriteTabIcon } from '../src/components/icons/NavigationIcons';

describe('navigation icons', () => {
  it('keeps the Journal paths while normalizing only their stroke grammar', () => {
    const screen = render(<JournalTabIcon focused testID="journal-active" />);
    const svg = screen.UNSAFE_getByType(Svg);
    const paths = screen.UNSAFE_getAllByType(Path);

    expect(svg.props.width).toBe(30);
    expect(svg.props.opacity).toBe(0.98);
    expect(paths).toHaveLength(6);
    expect(paths.map((path) => path.props.strokeWidth)).toEqual([
      1.8,
      1.8,
      1.4,
      0.9,
      0.9,
      0.9,
    ]);
    paths.forEach((path) => expect(path.props.strokeLinecap).toBe('round'));
    expect(paths[0].props.d).not.toBe(paths[1].props.d);
    expect(paths[1].props.d).toContain('33.05 2.75');
    expect(paths[2].props.d).toContain('18.28 12.1');
    expect(paths[5].props.d).toContain('M24.15 8.18');
    expect(paths[3].props.opacity).toBe(0.62);
    expect(paths[4].props.opacity).toBe(0.62);
    expect(paths[5].props.opacity).toBe(0.48);
  });

  it('uses no dot or badge in either state', () => {
    const active = render(<JournalTabIcon focused />);
    const inactive = render(<JournalTabIcon focused={false} />);

    expect(active.UNSAFE_queryAllByType(Circle)).toHaveLength(0);
    expect(inactive.UNSAFE_queryAllByType(Circle)).toHaveLength(0);
    expect(inactive.UNSAFE_getByType(Svg).props.opacity).toBe(0.58);
  });

  it('crops the Insights eye below its detached dots and uses the navigation state inks', () => {
    const active = render(<InsightsTabIcon focused testID="insights-active" />);
    const inactive = render(<InsightsTabIcon focused={false} testID="insights-inactive" />);
    const activeFrame = StyleSheet.flatten(active.getByTestId('insights-active').props.style);
    const inactiveFrame = StyleSheet.flatten(inactive.getByTestId('insights-inactive').props.style);
    const activeImage = StyleSheet.flatten(active.UNSAFE_getByType(Image).props.style);
    const inactiveImage = StyleSheet.flatten(inactive.UNSAFE_getByType(Image).props.style);

    expect(activeFrame).toEqual(expect.objectContaining({ width: 29, opacity: 0.98 }));
    expect(activeFrame.height).toBeCloseTo(21.34, 1);
    expect(inactiveFrame).toEqual(expect.objectContaining({ width: 29, opacity: 0.58 }));
    expect(activeImage).toEqual(expect.objectContaining({
      top: expect.any(Number),
      tintColor: '#5E4566',
    }));
    expect(activeImage.top).toBeLessThan(-18);
    expect(inactiveImage.tintColor).toBe('#897B8C');
    expect(active.UNSAFE_queryAllByType(Circle)).toHaveLength(0);
  });

  it('keeps the authored feather at its original aspect ratio with no synthetic underlay', () => {
    const active = render(<WriteTabIcon focused testID="write-active" />);
    const inactive = render(<WriteTabIcon focused={false} testID="write-inactive" />);
    const activeFrame = StyleSheet.flatten(active.getByTestId('write-active').props.style);
    const inactiveFrame = StyleSheet.flatten(inactive.getByTestId('write-inactive').props.style);
    const activeImage = StyleSheet.flatten(active.UNSAFE_getByType(Image).props.style);
    const inactiveImage = StyleSheet.flatten(inactive.UNSAFE_getByType(Image).props.style);

    expect(activeFrame.height).toBe(30);
    expect(activeFrame.width).toBeCloseTo(19.6, 1);
    expect(activeFrame.opacity).toBe(0.98);
    expect(inactiveFrame.opacity).toBe(0.58);
    expect(activeImage).toEqual(expect.objectContaining({
      tintColor: '#5E4566',
    }));
    expect(activeImage.width / activeImage.height).toBe(1);
    expect(inactiveImage.tintColor).toBe('#897B8C');
  });
});
