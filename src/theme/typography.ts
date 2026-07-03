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

  // Semantic role guidance. Keep screen hierarchy restrained: brand gets the
  // expressive serif, app UI stays sans, reflection copy breathes through line-height.
  roles: {
    brand: 'CormorantGaramond_600SemiBold',
    ui: 'Inter_400Regular',
    uiEmphasis: 'Inter_500Medium',
    uiStrong: 'CormorantGaramond_600SemiBold',
    reflection: 'Inter_400Regular',
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
