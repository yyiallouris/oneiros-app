export const typography = {
  // Font families
  // Two-family rule:
  // - Cormorant Garamond is reserved for the Oneiros wordmark / splash brand moment.
  // - Alegreya Sans is the app UI and reflection font, with generous line-height for essays.
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

  // Semantic role guidance. Keep screen hierarchy restrained: brand gets the
  // expressive serif, app UI stays sans, reflection copy breathes through line-height.
  roles: {
    brand: 'CormorantGaramond_600SemiBold',
    ui: 'AlegreyaSans_400Regular',
    uiEmphasis: 'AlegreyaSans_500Medium',
    uiStrong: 'AlegreyaSans_700Bold',
    reflection: 'AlegreyaSans_400Regular',
    poeticShortTitle: 'CormorantGaramond_600SemiBold',
  },
  
  // Font weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '500' as const,
    bold: '700' as const,
  },
};
