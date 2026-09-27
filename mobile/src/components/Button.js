import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing, radius, type } from '../theme/index.js';

/** variant: primary | secondary | ghost | danger */
export function Button({ title, onPress, variant = 'primary', disabled, loading, style, full = true }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{ color: 'rgba(255,255,255,0.10)' }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        full && styles.full,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onGold : colors.gold} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]} numberOfLines={1}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
  primary: { backgroundColor: colors.gold },
  secondary: { backgroundColor: colors.goldSoft, borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)' },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: 'rgba(242,99,126,0.15)', borderWidth: 1, borderColor: colors.danger },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
  text: { ...type.button },
  primaryText: { color: colors.onGold },
  secondaryText: { color: colors.gold },
  ghostText: { color: colors.text },
  dangerText: { color: colors.danger },
});
