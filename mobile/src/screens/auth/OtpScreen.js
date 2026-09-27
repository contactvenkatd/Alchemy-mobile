import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen.js';
import { GradientButton } from '../../components/GradientButton.js';
import { TextField } from '../../components/TextField.js';
import { useAuthStore, useT } from '../../store/authStore.js';
import { colors, radius, spacing, type } from '../../theme/index.js';

const RESEND_SECONDS = 30;

export default function OtpScreen({ route, navigation }) {
  const t = useT();
  const { phone, isNewUser, devOtp } = route.params;

  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const loading = useAuthStore((s) => s.loading);

  const [otp, setOtp] = useState(devOtp || '');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer.current);
  }, []);

  const onVerify = async () => {
    if (!/^\d{6}$/.test(otp)) return setError(t('auth.invalidOtp'));
    setError(null);
    try {
      // The signed-in user lands on the tabs automatically — RootNavigator
      // swaps the stack as soon as the token hits the store.
      await verifyOtp({ phone, otp, name: name.trim() || undefined, city: city.trim() || undefined });
    } catch (err) {
      setError(err.message);
    }
  };

  const onResend = async () => {
    try {
      const res = await requestOtp(phone);
      setSeconds(RESEND_SECONDS);
      if (res.devOtp) setOtp(res.devOtp);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('auth.otpTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.otpSubtitle', { phone: `+91 ${phone}` })}</Text>

          {devOtp ? <Text style={styles.devNotice}>{t('auth.devOtpNotice', { otp: devOtp })}</Text> : null}

          <TextField
            placeholder={t('auth.otpPlaceholder')}
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="sms-otp"
            style={styles.otpField}
            error={error}
          />

          {isNewUser ? (
            <View style={styles.newUser}>
              <TextField label={t('auth.nameLabel')} value={name} onChangeText={setName} maxLength={60} />
              <TextField label={t('auth.cityLabel')} value={city} onChangeText={setCity} maxLength={60} />
            </View>
          ) : null}

          <GradientButton title={t('auth.verify')} onPress={onVerify} loading={loading} />

          <View style={styles.footer}>
            <Pressable onPress={onResend} disabled={seconds > 0} hitSlop={8}>
              <Text style={[styles.link, seconds > 0 && styles.linkDisabled]}>
                {seconds > 0 ? t('auth.resendIn', { seconds }) : t('auth.resend')}
              </Text>
            </Pressable>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <Text style={styles.link}>{t('auth.changeNumber')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { ...type.h1, fontSize: 24, marginTop: spacing.lg },
  subtitle: { ...type.body, color: colors.textMuted },
  devNotice: {
    backgroundColor: colors.goldSoft, color: colors.gold, padding: spacing.md,
    borderRadius: radius.md, fontFamily: type.pill.fontFamily, fontSize: 13,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)',
  },
  otpField: { marginTop: spacing.sm },
  newUser: { gap: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  link: { fontFamily: type.label.fontFamily, color: colors.gold, fontSize: 14, paddingVertical: spacing.sm },
  linkDisabled: { color: colors.textFaint },
});
