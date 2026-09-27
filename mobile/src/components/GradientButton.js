import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, type } from '../theme/index.js';

/** size: lg (default CTA) | sm (inline, e.g. the Buy button on a product card) */
export function GradientButton({ title, onPress, loading, disabled, style, size = 'lg' }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
      style={({ pressed }) => [styles.wrap, isDisabled && styles.disabled, pressed && !isDisabled && styles.pressed, style]}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={[colors.goldLight, colors.gold, colors.goldDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, styles[size]]}
      >
        {loading ? (
          <ActivityIndicator color={colors.onGold} size={size === 'sm' ? 'small' : undefined} />
        ) : (
          <Text style={[styles.text, size === 'sm' && styles.textSm]} numberOfLines={1}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md, overflow: 'hidden' },
  gradient: { alignItems: 'center', justifyContent: 'center' },
  lg: { minHeight: 54, paddingHorizontal: 16 },
  sm: { minHeight: 36, paddingHorizontal: 12 },
  text: { ...type.buttonLg },
  textSm: { fontSize: 13, letterSpacing: 0.2 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.9 },
});
