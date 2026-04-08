import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import renderer from 'react-test-renderer';
import Svg, { Path } from 'react-native-svg';
import type { ReactTestInstance } from 'react-test-renderer';

import {
  ArchetypesIcon,
  DreamsLoggedIcon,
  MotifsIcon,
  PatternRecognitionIcon,
  PlacesIcon,
  SymbolsIcon,
} from '../src/components/icons/InsightsIcons';
import ArchetypesSvg from '../src/components/icons/generated/Archetypes';

describe('insights icons', () => {
  it('renders all insights icons', () => {
    const { getByTestId } = render(
      <View>
        <ArchetypesIcon testID="icon-archetypes" size={88} />
        <DreamsLoggedIcon testID="icon-dreams-logged" size={88} />
        <MotifsIcon testID="icon-motifs" size={88} />
        <PatternRecognitionIcon testID="icon-pattern-recognition" size={88} />
        <PlacesIcon testID="icon-places" size={88} />
        <SymbolsIcon testID="icon-symbols" size={88} />
      </View>
    );

    expect(getByTestId('icon-archetypes')).toBeTruthy();
    expect(getByTestId('icon-dreams-logged')).toBeTruthy();
    expect(getByTestId('icon-motifs')).toBeTruthy();
    expect(getByTestId('icon-pattern-recognition')).toBeTruthy();
    expect(getByTestId('icon-places')).toBeTruthy();
    expect(getByTestId('icon-symbols')).toBeTruthy();
  });

  it('keeps the archetypes icon viewBox so it stays visible when scaled', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<ArchetypesSvg width={88} height={88} />);
    });
    const svgRoot = tree!.root.findByType(Svg);

    expect(svgRoot.props.viewBox).toBe('0 0 872 830');
  });

  it('supports a shared color prop for insights icons', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<MotifsIcon size={88} color="#123456" />);
    });

    const paths = tree!.root.findAllByType(Path);
    const tintedPaths = paths.filter(
      (path: ReactTestInstance) => path.props.fill === '#123456' || path.props.stroke === '#123456'
    );

    expect(paths.length).toBeGreaterThan(0);
    expect(tintedPaths.length).toBeGreaterThan(0);
  });
});
