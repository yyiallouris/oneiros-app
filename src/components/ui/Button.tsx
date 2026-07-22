import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import {
  buttonSizes,
  ghostButton,
  ghostButtonText,
  primaryButton,
  primaryButtonText,
  secondaryButton,
  secondaryButtonText,
  type ButtonSize,
} from '../../theme/buttons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: ButtonSize;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled = false,
  style,
  textStyle,
}) => {
  const sizeStyle = buttonSizes[size];

  const variantStyles = {
    primary: {
      button: [primaryButton.base, disabled ? primaryButton.disabled : primaryButton.active],
      text: [primaryButtonText.active, disabled && primaryButtonText.disabled],
    },
    secondary: {
      button: [
        secondaryButton.base,
        disabled ? secondaryButton.disabled : secondaryButton.active,
      ],
      text: [secondaryButtonText.active, disabled && secondaryButtonText.disabled],
    },
    ghost: {
      button: [ghostButton.base, disabled && ghostButton.disabled],
      text: [ghostButtonText.active, disabled && ghostButtonText.disabled],
    },
  }[variant];

  return (
    <TouchableOpacity
      style={[styles.button, sizeStyle, ...variantStyles.button, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[...variantStyles.text, textStyle]}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.9}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
