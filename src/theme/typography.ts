export const typography = {
  // Font families
  // Brand typography:
  // - "Oneiros" wordmark / splash title uses a romanesque serif feel.
  // - UI copy stays on Inter for clarity and contrast.
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  bold: 'CormorantGaramond_600SemiBold',
  
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
  
  // Font weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

