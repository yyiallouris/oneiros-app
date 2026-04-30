export const typography = {
  // Font families
  // Brand typography:
  // - "Oneiros" wordmark / splash title uses a romanesque serif feel.
  // - UI copy and user-generated multilingual text use Alegreya Sans for
  //   Greek-safe, warmer letterforms that sit closer to the symbolic icons.
  regular: 'AlegreyaSans_400Regular',
  medium: 'AlegreyaSans_500Medium',
  semibold: 'AlegreyaSans_500Medium',
  bold: 'AlegreyaSans_700Bold',
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
  
  // Font weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '500' as const,
    bold: '700' as const,
  },
};
