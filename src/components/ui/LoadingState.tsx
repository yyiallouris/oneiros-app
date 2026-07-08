import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme';
import {
  getLoadingContextStyle,
  loadingPresets,
  loadingStyles,
  loadingVisualSizes,
  type LoadingContext,
  type LoadingPreset,
  type LoadingPresetKey,
  type LoadingVariant,
} from '../../theme/loading';
import { BreathingLine } from './BreathingLine';
import { PrintPatchLoader } from './AbstractPrintTexture';

export interface LoadingStateProps {
  variant?: LoadingVariant;
  context?: LoadingContext;
  preset?: LoadingPresetKey;
  message?: string;
  submessage?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant: variantProp,
  context: contextProp,
  preset,
  message: messageProp,
  submessage: submessageProp,
  testID = 'loading-state',
  style,
}) => {
  const presetConfig: LoadingPreset | undefined = preset ? loadingPresets[preset] : undefined;
  const variant = variantProp ?? presetConfig?.variant ?? 'breath';
  const context = contextProp ?? presetConfig?.context ?? 'panel';
  const message = messageProp ?? presetConfig?.message;
  const submessage = submessageProp ?? presetConfig?.submessage;
  const visualSize = loadingVisualSizes[variant][context];
  const showCopy = context !== 'compact' && (message || submessage);

  return (
    <View
      style={[loadingStyles.base, getLoadingContextStyle(context), style]}
      testID={testID}
    >
      {variant === 'reflect' ? (
        <PrintPatchLoader size={visualSize} color={colors.buttonPrimary} />
      ) : (
        <BreathingLine width={visualSize} height={2} color={colors.buttonPrimary} />
      )}
      {showCopy && message ? (
        <Text style={loadingStyles.message}>{message}</Text>
      ) : null}
      {showCopy && submessage ? (
        <Text style={loadingStyles.submessage}>{submessage}</Text>
      ) : null}
    </View>
  );
};
