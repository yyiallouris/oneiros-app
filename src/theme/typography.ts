export const typography = {
  // Font families
  // Brand typography:
  // - "Oneiros" wordmark / splash title uses a romanesque serif feel.
  // - UI copy stays on Inter for clarity and contrast.
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_500Medium',
  bold: 'CormorantGaramond_600SemiBold',
  display: 'CormorantGaramond_600SemiBold',
  
  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },

  // Semantic role guidance. Serif marks dream material and the inward voice;
  // navigation, controls, metadata, and system/configuration titles stay sans.
  roles: {
    brand: 'CormorantGaramond_600SemiBold',
    ui: 'Inter_400Regular',
    uiEmphasis: 'Inter_500Medium',
    uiStrong: 'Inter_500Medium',
    screenTitle: 'Inter_500Medium',
    navigationTitle: 'Inter_500Medium',
    control: 'Inter_400Regular',
    metadata: 'Inter_400Regular',
    dreamTitle: 'CormorantGaramond_600SemiBold',
    innerVoice: 'CormorantGaramond_600SemiBold',
    reflection: 'CormorantGaramond_600SemiBold',
    poeticShortTitle: 'CormorantGaramond_600SemiBold',
  },
  
  // Font weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '500' as const,
    bold: '600' as const,
  },
};
