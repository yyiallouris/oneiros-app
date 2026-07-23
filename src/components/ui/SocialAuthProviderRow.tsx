import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type ImageSourcePropType,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows, backgrounds } from '../../theme';
import {
  AUTH_APPLE_PROVIDER,
  AUTH_OAUTH_PROVIDERS,
  type AuthOAuthProviderId,
} from '../../utils/authOAuth';

type SocialVisualVariant = 'light' | 'dark';

type SocialProviderItem = {
  id: AuthOAuthProviderId;
  accessibilityLabel: string;
  icon: ImageSourcePropType;
  variant: SocialVisualVariant;
  onPress: () => void;
};

type SocialAuthProviderRowProps = {
  disabled?: boolean;
  onGooglePress: () => void;
  onDiscordPress: () => void;
  onApplePress?: () => void;
};

/** Logo-only assets (true transparent PNG). Squircle chrome is styled in-app. */
const PROVIDER_ICONS: Record<AuthOAuthProviderId, ImageSourcePropType> = {
  google: require('../../assets/login/signup/providers_icons/google.png'),
  apple: require('../../assets/login/signup/providers_icons/apple.png'),
  discord: require('../../assets/login/signup/providers_icons/discord.png'),
};

const PROVIDER_VARIANTS: Record<AuthOAuthProviderId, SocialVisualVariant> = {
  google: 'light',
  apple: 'light',
  discord: 'dark',
};

const BUTTON_SIZE = 56;
const ICON_SIZE = 28;

export const SocialAuthProviderRow: React.FC<SocialAuthProviderRowProps> = ({
  disabled = false,
  onGooglePress,
  onDiscordPress,
  onApplePress,
}) => {
  const providers: SocialProviderItem[] = [];

  const google = AUTH_OAUTH_PROVIDERS.find((provider) => provider.id === 'google');
  const discord = AUTH_OAUTH_PROVIDERS.find((provider) => provider.id === 'discord');

  if (google) {
    providers.push({
      id: google.id,
      accessibilityLabel: google.buttonTitle,
      icon: PROVIDER_ICONS.google,
      variant: PROVIDER_VARIANTS.google,
      onPress: onGooglePress,
    });
  }

  if (Platform.OS === 'ios' && onApplePress) {
    // Custom equal-size squircle (same prominence as Google/Discord). Apple HIG allows
    // custom Sign in with Apple marks when visually equivalent to other providers.
    providers.push({
      id: AUTH_APPLE_PROVIDER.id,
      accessibilityLabel: AUTH_APPLE_PROVIDER.buttonTitle,
      icon: PROVIDER_ICONS.apple,
      variant: PROVIDER_VARIANTS.apple,
      onPress: onApplePress,
    });
  }

  if (discord) {
    providers.push({
      id: discord.id,
      accessibilityLabel: discord.buttonTitle,
      icon: PROVIDER_ICONS.discord,
      variant: PROVIDER_VARIANTS.discord,
      onPress: onDiscordPress,
    });
  }

  return (
    <View style={styles.section} pointerEvents={disabled ? 'none' : 'auto'}>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.divider} />
      </View>

      <View style={[styles.row, disabled && styles.rowDisabled]}>
        {providers.map((provider) => {
          const isDark = provider.variant === 'dark';
          return (
            <TouchableOpacity
              key={provider.id}
              onPress={provider.onPress}
              disabled={disabled}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={provider.accessibilityLabel}
              testID={`oauth-provider-${provider.id}`}
              style={[
                styles.providerButton,
                isDark ? styles.providerButtonDark : styles.providerButtonLight,
              ]}
            >
              <Image
                source={provider.icon}
                style={styles.providerIcon}
                resizeMode="contain"
                accessible={false}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  providerButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: shadows.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  providerButtonLight: {
    backgroundColor: backgrounds.tertiary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(45, 36, 48, 0.06)',
  },
  providerButtonDark: {
    backgroundColor: '#242428',
  },
  providerIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
