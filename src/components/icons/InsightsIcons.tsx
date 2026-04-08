import React from 'react';
import type { SvgProps } from 'react-native-svg';

import ArchetypesSvg from './generated/Archetypes';
import DreamsLoggedSvg from './generated/DreamsLogged';
import MotifsSvg from './generated/Motifs';
import PatternRecognitionSvg from './generated/PatternRecognition3';
import PlacesSvg from './generated/Places';
import SymbolsSvg from './generated/Symbols4';

type IconProps = Omit<SvgProps, 'width' | 'height' | 'color'> & {
  size?: number;
  color?: string;
};

function tintSvgTree(node: React.ReactNode, color?: string): React.ReactNode {
  if (color == null) return node;

  if (!React.isValidElement(node)) return node;

  const nextProps: Record<string, unknown> = {};
  const props = node.props as Record<string, unknown>;
  const fill = props.fill;
  const stroke = props.stroke;
  const children = props.children as React.ReactNode;

  if (typeof fill === 'string' && fill !== 'none' && fill !== 'transparent') {
    nextProps.fill = color;
  }

  if (typeof stroke === 'string' && stroke !== 'none' && stroke !== 'transparent') {
    nextProps.stroke = color;
  }

  if (children != null) {
    nextProps.children = React.Children.map(children, (child) => tintSvgTree(child, color));
  }

  return React.cloneElement(node, nextProps);
}

function createSizedIcon(IconComponent: (props: SvgProps) => React.JSX.Element) {
  return ({ size = 24, color, ...props }: IconProps) => {
    const iconTree = IconComponent({ width: size, height: size, ...props });
    return tintSvgTree(iconTree, color) as React.JSX.Element;
  };
}

export const ArchetypesIcon = createSizedIcon(ArchetypesSvg);
export const DreamsLoggedIcon = createSizedIcon(DreamsLoggedSvg);
export const MotifsIcon = createSizedIcon(MotifsSvg);
export const PatternRecognitionIcon = createSizedIcon(PatternRecognitionSvg);
export const PlacesIcon = createSizedIcon(PlacesSvg);
export const SymbolsIcon = createSizedIcon(SymbolsSvg);
