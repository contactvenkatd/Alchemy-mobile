import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/index.js';

export function Badge({ label, tone = 'accent', style }) {
  return (
    <View style={[styles.badge, styles[tone], style]}>
      <Text style={[styles.text, styles[`${tone}Text`]]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  accent: { backgroundColor: colors.goldSoft, borderColor: 'rgba(201,168,76,0.35)' },
  accentText: { color: colors.gold },
  success: { backgroundColor: 'rgba(61,214,140,0.12)', borderColor: 'rgba(61,214,140,0.35)' },
  successText: { color: colors.success },
  muted: { backgroundColor: colors.cardLift, borderColor: colors.border },
  mutedText: { color: colors.textMuted },
  danger: { backgroundColor: 'rgba(242,99,126,0.12)', borderColor: 'rgba(242,99,126,0.35)' },
  dangerText: { color: colors.danger },
  text: { fontSize: 11, fontFamily: fonts.medium, letterSpacing: 0.2 },
});
