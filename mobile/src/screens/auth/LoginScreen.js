import { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '../../components/GradientButton.js';
import { CountryCodePicker, DEFAULT_COUNTRY } from '../../components/CountryCodePicker.js';
import { useAuthStore, useT } from '../../store/authStore.js';
import { isAppleAvailable, signInWithApple, signInWithGoogle } from '../../auth/social.js';
import { LANGUAGES } from '../../i18n/index.js';
import { colors, MAX_WIDTH, radius, spacing, type } from '../../theme/index.js';

export default function LoginScreen({ navigation }) {
  const t = useT();
  const language = useAuthStore((s) => s.language);
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const socialSignIn = useAuthStore((s) => s.socialSignIn);
  const loading = useAuthStore((s) => s.loading);

  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [referral, setReferral] = useState('');
  const [error, setError] = useState(null);
  const [focused, setFocused] = useState(null);
  const [busy, setBusy] = useState(null); // 'phone' | 'google' | 'apple'
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    isAppleAvailable().then(setAppleAvailable);
  }, []);

  const onSubmit = async () => {
    const clean = phone.replace(/\D/g, '');

    // India has a known mobile prefix; other countries get a length check.
    const valid = country.code === '+91'
      ? /^[6-9]\d{9}$/.test(clean)
      : clean.length === country.digits;
    if (!valid) return setError(t('auth.invalidPhone'));

    setError(null);
    setBusy('phone');
    try {
      const fullPhone = `${country.code}${clean}`;
      const res = await requestOtp(fullPhone, referral.trim().toUpperCase());
      navigation.navigate('Otp', { phone: fullPhone, isNewUser: res.isNewUser, devOtp: res.devOtp });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  // RootNavigator swaps to the tabs as soon as the token lands in the store.
  const onSocial = async (provider) => {
    setError(null);
    setBusy(provider);
    try {
      const credential = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
      if (credential) {
        await socialSignIn(provider, { ...credential, referralCode: referral.trim().toUpperCase() || undefined });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
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

            <GradientButton
              title={t('auth.continueWithPhone')}
              onPress={onSubmit}
              loading={busy === 'phone'}
              disabled={loading || !!busy}
              style={styles.cta}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <SocialButton
              icon="logo-google"
              title={t('auth.continueWithGoogle')}
              onPress={() => onSocial('google')}
              loading={busy === 'google'}
              disabled={loading || !!busy}
            />
            {appleAvailable ? (
              <SocialButton
                icon="logo-apple"
                title={t('auth.continueWithApple')}
                onPress={() => onSocial('apple')}
                loading={busy === 'apple'}
                disabled={loading || !!busy}
                variant="apple"
              />
            ) : null}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** variant: default (outlined, dark) | apple (solid white, per Apple's button guidelines) */
function SocialButton({ icon, title, onPress, loading, disabled, variant }) {
  const apple = variant === 'apple';
  const fg = apple ? '#000' : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.social,
        apple && styles.socialApple,
        disabled && !loading && styles.socialDisabled,
        pressed && styles.socialPressed,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          <Ionicons name={icon} size={20} color={fg} />
          <Text style={[styles.socialText, { color: fg }]} numberOfLines={1}>{title}</Text>
        </>
      )}
    </Pressable>
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

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: { ...type.caption, color: colors.textMuted },

  social: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
  },
  socialApple: { backgroundColor: '#fff', borderColor: '#fff' },
  socialDisabled: { opacity: 0.45 },
  socialPressed: { opacity: 0.85 },
  socialText: { ...type.labelStrong, fontSize: 16 },
});
