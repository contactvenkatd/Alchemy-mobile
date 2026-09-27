import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientButton } from '../../components/GradientButton.js';
import { CountryCodePicker, DEFAULT_COUNTRY } from '../../components/CountryCodePicker.js';
import { useAuthStore, useT } from '../../store/authStore.js';
import { LANGUAGES } from '../../i18n/index.js';
import { colors, MAX_WIDTH, radius, spacing, type } from '../../theme/index.js';

export default function LoginScreen({ navigation }) {
  const t = useT();
  const language = useAuthStore((s) => s.language);
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const loading = useAuthStore((s) => s.loading);

  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [referral, setReferral] = useState('');
  const [error, setError] = useState(null);
  const [focused, setFocused] = useState(null);

  const onSubmit = async () => {
    const clean = phone.replace(/\D/g, '');

    // India is the only code the API accepts today; other countries get a
    // length check so the field still behaves while that catches up.
    const valid = country.code === '+91'
      ? /^[6-9]\d{9}$/.test(clean)
      : clean.length === country.digits;
    if (!valid) return setError(t('auth.invalidPhone'));

    setError(null);
    try {
      const res = await requestOtp(clean, referral.trim().toUpperCase());
      navigation.navigate('Otp', { phone: clean, isNewUser: res.isNewUser, devOtp: res.devOtp });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.langRow}>
            {LANGUAGES.map((l) => (
              <Pressable
                key={l.code}
                onPress={() => setLanguage(l.code)}
                style={[styles.langChip, language === l.code && styles.langChipActive]}
                hitSlop={4}
              >
                <Text style={[styles.langText, language === l.code && styles.langTextActive]}>
                  {l.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.brandBlock}>
            <Text style={styles.wordmark}>Alchemy</Text>
            <View style={styles.rule} />
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('auth.phoneLabel')}</Text>
            <View style={[styles.phoneRow, focused === 'phone' && styles.inputFocused, error && styles.inputError]}>
              <CountryCodePicker value={country} onChange={setCountry} label={t('auth.countryCode')} />
              <TextInput
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, country.digits))}
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused(null)}
                placeholder={t('auth.phonePlaceholder')}
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={country.digits}
                autoComplete="tel"
                style={styles.phoneInput}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={[styles.cardLabel, styles.secondaryLabel]}>{t('auth.referralLabel')}</Text>
            <TextInput
              value={referral}
              onChangeText={(v) => setReferral(v.toUpperCase().slice(0, 8))}
              onFocus={() => setFocused('ref')}
              onBlur={() => setFocused(null)}
              placeholder="ABC123"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              style={[styles.referralInput, focused === 'ref' && styles.inputFocused]}
            />

            <GradientButton title={t('auth.sendOtp')} onPress={onSubmit} loading={loading} style={styles.cta} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  langRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end', paddingTop: spacing.sm },
  langChip: {
    paddingHorizontal: spacing.md,
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(232,176,75,0.35)',
  },
  langChipActive: { backgroundColor: 'rgba(232,176,75,0.16)', borderColor: colors.gold },
  langText: { ...type.label, fontSize: 13 },
  langTextActive: { color: colors.gold },

  brandBlock: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.xl, gap: spacing.md },
  wordmark: { ...type.wordmarkLg, includeFontPadding: false },
  rule: { width: 56, height: 2, backgroundColor: colors.gold, borderRadius: 1 },
  tagline: {
    ...type.label,
    fontSize: 14,
    letterSpacing: 1.1,
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    // Elevation on Android, layered shadow on iOS.
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
  cardLabel: { ...type.labelStrong },
  secondaryLabel: { ...type.label, marginTop: spacing.md, fontSize: 12 },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    marginTop: spacing.xs,
  },
  phoneInput: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    ...type.input,
    fontSize: 17,
  },
  referralInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...type.input,
    fontSize: 14,
    backgroundColor: colors.bg,
    letterSpacing: 1.5,
    marginTop: spacing.xs,
  },
  inputFocused: { borderColor: colors.gold },
  inputError: { borderColor: colors.danger },
  error: { ...type.caption, color: colors.danger, marginTop: spacing.xs },

  cta: { marginTop: spacing.lg },
});
