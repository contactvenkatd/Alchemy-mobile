import { useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen.js';
import { Avatar } from '../components/Avatar.js';
import { Button } from '../components/Button.js';
import { StatCard } from '../components/StatCard.js';
import { userApi } from '../api/endpoints.js';
import { useAuthStore, useT } from '../store/authStore.js';
import { LANGUAGES } from '../i18n/index.js';
import { colors, radius, spacing, type } from '../theme/index.js';
import { formatMoney, formatDate, formatPhone } from '../utils/format.js';

export default function ProfileScreen() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const language = useAuthStore((s) => s.language);
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const logout = useAuthStore((s) => s.logout);

  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSummary = async () => {
    setRefreshing(true);
    try {
      setSummary(await userApi.summary());
    } catch {
      // Keep the last good summary on screen rather than blanking it out.
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { loadSummary(); }, []);

  const copyLink = async () => {
    if (!summary?.referralLink) return;
    await Clipboard.setStringAsync(summary.referralLink);
    Alert.alert(t('profile.copied'), summary.referralLink);
  };

  const confirmLogout = () => {
    Alert.alert(t('profile.logout'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadSummary}
            tintColor={colors.gold}
            colors={[colors.gold]}
            progressBackgroundColor={colors.card}
          />
        }
      >
        <View style={styles.header}>
          <Avatar name={user?.name} uri={user?.avatarUrl} size={92} />
          <Text style={styles.name} numberOfLines={1}>{user?.name || '—'}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {user?.phone ? formatPhone(user.phone) : user?.email}{user?.city ? ` · ${user.city}` : ''}
          </Text>
          <Text style={styles.metaFaint}>{t('profile.member', { date: formatDate(user?.createdAt, language) })}</Text>
        </View>

        {/* Headline three: earnings, referrals, pool share. */}
        <View style={styles.heroRow}>
          <View style={styles.heroCell}>
            <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatMoney(summary?.lifetimeEarnings ?? 0, { compact: true })}
            </Text>
            <Text style={styles.heroLabel}>{t('profile.lifetime')}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroCell}>
            <Text style={styles.heroValue}>{summary?.referralCount ?? 0}</Text>
            <Text style={styles.heroLabel}>{t('profile.referrals')}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroCell}>
            <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
              {(summary?.pool?.sharePercent ?? 0).toFixed(2)}%
            </Text>
            <Text style={styles.heroLabel}>{t('pool.yourShare')}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('profile.earnings')}</Text>
        <View style={styles.grid}>
          <StatCard label={t('wallet.balance')} value={formatMoney(summary?.walletBalance ?? user?.walletBalance ?? 0)} tone="accent" />
          <StatCard label={t('wallet.cashbackEarned')} value={formatMoney(summary?.cashbackEarnings ?? 0)} />
        </View>
        <View style={styles.grid}>
          <StatCard label={t('wallet.referralEarned')} value={formatMoney(summary?.referralEarnings ?? 0)} />
          <StatCard label={t('pool.returns')} value={formatMoney(summary?.poolPayouts ?? 0)} />
        </View>

        <Text style={styles.sectionTitle}>{t('profile.referralLink')}</Text>
        <View style={styles.card}>
          <View style={styles.codeRow}>
            <Text style={styles.referralCode}>{summary?.referralCode || user?.referralCode || '—'}</Text>
            <Pressable onPress={copyLink} hitSlop={8} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={18} color={colors.gold} />
            </Pressable>
          </View>
          <Text style={styles.referralLink} numberOfLines={1}>{summary?.referralLink || ''}</Text>
          <Button title={t('profile.copyLink')} variant="secondary" onPress={copyLink} />
        </View>

        <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => setLanguage(l.code)}
              style={[styles.langChip, language === l.code && styles.langChipActive]}
            >
              <Text style={[styles.langText, language === l.code && styles.langTextActive]}>{l.label}</Text>
            </Pressable>
          ))}
        </View>

        <Button title={t('profile.logout')} variant="danger" onPress={confirmLogout} style={styles.logout} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.sm },
  name: { ...type.h2, fontSize: 22, marginTop: spacing.sm },
  meta: { ...type.meta, fontSize: 13 },
  metaFaint: { ...type.tiny },

  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  heroCell: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: spacing.xs },
  heroDivider: { width: 1, height: 32, backgroundColor: colors.border },
  heroValue: { fontFamily: type.price.fontFamily, fontSize: 18, color: colors.gold },
  heroLabel: { fontFamily: type.label.fontFamily, fontSize: 10, color: colors.textMuted, textAlign: 'center', letterSpacing: 0.3 },

  sectionTitle: { ...type.sectionLabel, marginTop: spacing.md },
  grid: { flexDirection: 'row', gap: spacing.md },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.sm,
  },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  referralCode: { fontFamily: type.price.fontFamily, fontSize: 26, color: colors.gold, letterSpacing: 3 },
  copyBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  referralLink: { ...type.tiny },

  langRow: { flexDirection: 'row', gap: spacing.sm },
  langChip: {
    flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  langChipActive: { backgroundColor: colors.goldSoft, borderColor: 'rgba(201,168,76,0.45)' },
  langText: { fontFamily: type.label.fontFamily, fontSize: 15, color: colors.textMuted },
  langTextActive: { color: colors.gold },
  logout: { marginTop: spacing.lg },
});
