import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme/index.js';

/**
 * The phone is sent to the API as E.164: `${country.code}${digits}`.
 * `digits` drives client-side validation per country.
 */
export const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', name: 'India', digits: 10 },
  { code: '+977', flag: '🇳🇵', name: 'Nepal', digits: 10 },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh', digits: 10 },
  { code: '+94', flag: '🇱🇰', name: 'Sri Lanka', digits: 9 },
  { code: '+971', flag: '🇦🇪', name: 'UAE', digits: 9 },
  { code: '+1', flag: '🇺🇸', name: 'United States', digits: 10 },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom', digits: 10 },
];

// US while testing on a US number; switch back to India (COUNTRIES[0]) for launch.
export const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.code === '+1');

export function CountryCodePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);

  const select = (country) => {
    onChange(country);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value.name} ${value.code}`}
      >
        <Text style={styles.flag}>{value.flag}</Text>
        <Text style={styles.code}>{value.code}</Text>
        <Text style={styles.caret}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => {
                const active = item.code === value.code;
                return (
                  <Pressable
                    onPress={() => select(item)}
                    style={[styles.row, active && styles.rowActive]}
                    android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                  >
                    <Text style={styles.rowFlag}>{item.flag}</Text>
                    <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.rowCode, active && styles.rowCodeActive]}>{item.code}</Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  // No fontFamily: emoji flags must fall to the system emoji face.
  flag: { fontSize: 20 },
  code: { fontFamily: type.h3.fontFamily, fontSize: 16, color: colors.text },
  caret: { ...type.tiny, color: colors.textMuted, marginTop: 2 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  sheetTitle: {
    ...type.h3,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  rowActive: { backgroundColor: colors.goldSoft },
  // No fontFamily, same reason as `flag` above.
  rowFlag: { fontSize: 22 },
  rowName: { flex: 1, ...type.bodyStrong },
  rowCode: { fontFamily: type.label.fontFamily, fontSize: 15, color: colors.textMuted },
  rowCodeActive: { color: colors.gold },
});
