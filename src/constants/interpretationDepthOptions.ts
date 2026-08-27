import type { InterpretationDepth } from '../services/userSettingsService';

export const INTERPRETATION_DEPTH_OPTIONS: ReadonlyArray<{
  value: InterpretationDepth;
  label: string;
  hint: string;
}> = [
  { value: 'quick', label: 'Quick Glance', hint: 'A short reflection on one clear thread.' },
  { value: 'standard', label: 'Core Reflection (recommended)', hint: 'A fuller reading of the dream’s images and inner movement.' },
  { value: 'advanced', label: 'Deeper Dive', hint: 'An extended reflection when you want to explore the dream further.' },
];
