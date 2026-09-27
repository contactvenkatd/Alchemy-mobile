import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme/index.js';

export function StatCard({ label, value, hint, tone = 'default', style }) {
  return (
    <View style={[styles.card, tone === 'accent' && styles.accent, style]}>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
      <Text
        style={[styles.value, tone === 'accent' && styles.accentValue]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {hint ? <Text style={styles.hint} numberOfLines={1}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 130,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  accent: { borderColor: 'rgba(201,168,76,0.35)' },
  label: { ...type.tiny, color: colors.textMuted, marginBottom: 2, letterSpacing: 0.3 },
  value: { ...type.statValue },
  accentValue: { color: colors.gold },
  hint: { ...type.tiny },
});
