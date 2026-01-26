import React from 'react';
import { MoonIcon } from './MoonIcon';
import { SunIcon } from './SunIcon';
import { KeyIcon } from './KeyIcon';
import { EyeIcon } from './EyeIcon';
import { LabyrinthIcon } from './LabyrinthIcon';
import { JungianSymbol } from '../../types/dream';

interface SymbolIconProps {
  symbol: JungianSymbol;
  size?: number;
  color?: string;
}

export const SymbolIcon: React.FC<SymbolIconProps> = ({ symbol, size, color }) => {
  switch (symbol) {
    case 'moon':
      return <MoonIcon size={size} color={color} />;
    case 'sun':
      return <SunIcon size={size} color={color} />;
    case 'key':
      return <KeyIcon size={size} color={color} />;
    case 'eye':
      return <EyeIcon size={size} color={color} />;
    case 'labyrinth':
      return <LabyrinthIcon size={size} color={color} />;
    default:
      return <MoonIcon size={size} color={color} />;
  }
};

export * from './MoonIcon';
export * from './SunIcon';
export * from './KeyIcon';
export * from './EyeIcon';
export * from './LabyrinthIcon';

// Helper to get random symbol
export const getRandomSymbol = (): JungianSymbol => {
  const symbols: JungianSymbol[] = ['moon', 'sun', 'key', 'eye', 'labyrinth'];
  return symbols[Math.floor(Math.random() * symbols.length)];
};

