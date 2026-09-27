import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, MAX_WIDTH, spacing, type } from '../theme/index.js';

/** Bar height below the status bar. The row is taller than the 44dp target. */
export const HEADER_BAR_HEIGHT = 56;

/**
 * Shared stack header. The black ground runs edge to edge behind the status
 * bar, while the row itself stays inside the notch and on the same
 * phone-width column as every screen body.
 *
 * `right` takes an optional trailing element.
 */
export function Header({ title, onBack, right, showBack = true }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.ground, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        {showBack ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ground: { backgroundColor: colors.bg },
  bar: {
    height: HEADER_BAR_HEIGHT,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // 44x44 is the minimum comfortable target; hitSlop widens it further.
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  title: { ...type.h3, flex: 1, marginLeft: spacing.xs },
  right: { minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
});
