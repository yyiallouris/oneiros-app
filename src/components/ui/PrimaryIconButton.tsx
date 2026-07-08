import React from 'react';
import {
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { primaryIconButton } from '../../theme/buttons';
import { LoadingState } from './LoadingState';

interface PrimaryIconButtonProps {
  onPress: () => void;
  disabled?: boolean;
  inactive?: boolean;
  loading?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const PrimaryIconButton: React.FC<PrimaryIconButtonProps> = ({
  onPress,
  disabled = false,
  inactive = false,
  loading = false,
  testID,
  style,
  children,
}) => {
  const showInactive = inactive && !loading;

  if (loading) {
    return (
      <LoadingState
        preset="sendMessage"
        testID={testID ? `${testID}-loading` : 'primary-icon-button-loading'}
        style={style}
      />
    );
  }

  return (
    <TouchableOpacity
      style={[
        primaryIconButton.base,
        showInactive ? primaryIconButton.inactive : primaryIconButton.active,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      testID={testID}
    >
      {children}
    </TouchableOpacity>
  );
};
