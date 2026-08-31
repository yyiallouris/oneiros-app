import React from 'react';
import { render } from '@testing-library/react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { JournalTabIcon } from '../src/components/icons/NavigationIcons';

describe('navigation icons', () => {
  it('keeps the Journal concept while one page drifts upward through the existing silhouette', () => {
    const screen = render(<JournalTabIcon focused testID="journal-active" />);
    const svg = screen.UNSAFE_getByType(Svg);
    const paths = screen.UNSAFE_getAllByType(Path);

    expect(svg.props.width).toBe(30);
    expect(svg.props.opacity).toBe(0.96);
    expect(paths).toHaveLength(6);
    expect(paths.map((path) => path.props.strokeWidth)).toEqual([
      1.28,
      1.04,
      1.1,
      0.92,
      0.88,
      0.6,
    ]);
    paths.forEach((path) => expect(path.props.strokeLinecap).toBe('round'));
    expect(paths[0].props.d).not.toBe(paths[2].props.d);
    expect(paths[2].props.d).toContain('C31.68 4.2 32.42 3.84 32.88 3.3');
    expect(paths[3].props.d).toContain('M32.78 6.72');
    expect(paths[4].props.d).toContain('C18.32 11.76 17.54 14.44');
  });

  it('uses no dot or badge in either state', () => {
    const active = render(<JournalTabIcon focused />);
    const inactive = render(<JournalTabIcon focused={false} />);

    expect(active.UNSAFE_queryAllByType(Circle)).toHaveLength(0);
    expect(inactive.UNSAFE_queryAllByType(Circle)).toHaveLength(0);
    expect(inactive.UNSAFE_getByType(Svg).props.opacity).toBe(0.76);
  });
});
