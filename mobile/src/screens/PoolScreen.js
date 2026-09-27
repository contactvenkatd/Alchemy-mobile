import { useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen.js';
import { StatCard } from '../components/StatCard.js';
import { Badge } from '../components/Badge.js';
import { EmptyState } from '../components/EmptyState.js';
import { usePoolStore } from '../store/walletStore.js';
import { useAuthStore, useT } from '../store/authStore.js';
import { colors, radius, spacing, type } from '../theme/index.js';
import { formatMoney, formatDate } from '../utils/format.js';

const STATUS_TONE = { active: 'success', repaid: 'muted', defaulted: 'danger' };

export default function PoolScreen() {
  const t = useT();
  const lang = useAuthStore((s) => s.language);
  const { pool, load, loading, error } = usePoolStore();

  useEffect(() => { load(); }, []);

  if (!pool) {
    return (
      <Screen>
        <EmptyState loading={loading} error={error} retryLabel={t('common.retry')} onRetry={load} />
      </Screen>
    );
  }

  const share = pool.me?.sharePercent ?? 0;
  const total = pool.balance + pool.invested;
  const deployedPercent = total > 0 ? (pool.invested / total) * 100 : 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.gold}
            colors={[colors.gold]}
            progressBackgroundColor={colors.card}
          />
        }
      >
        <Text style={styles.title}>{t('pool.title')}</Text>

        {/* The fund total reads as one object, so it gets a ring of its own. */}
        <View style={styles.dialWrap}>
          <View style={styles.dialOuter}>
            <View style={styles.dialInner}>
              <Text style={styles.dialLabel}>{t('pool.fundBalance')}</Text>
              <Text style={styles.dialValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatMoney(total, { compact: true })}
              </Text>
              <Text style={styles.dialHint}>{t('pool.activeBusinesses')}: {pool.activeBusinessCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>{t('pool.invested')}</Text>
            <Text style={styles.cardValue}>{deployedPercent.toFixed(0)}%</Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.min(100, deployedPercent)}%` }]} />
          </View>
          <Text style={styles.cardHint}>
            {formatMoney(pool.invested, { compact: true })} / {formatMoney(total, { compact: true })}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>{t('pool.yourShare')}</Text>
            <Text style={styles.sharePercent}>{share.toFixed(2)}%</Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.min(100, Math.max(share, 0.6))}%` }]} />
          </View>
          <Text style={styles.cardHint}>
            {t('pool.yourValue')}: {formatMoney(pool.me?.valuePaise ?? 0)}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label={t('pool.returns')} value={formatMoney(pool.totalReturns, { compact: true })} tone="accent" />
          <StatCard label={t('wallet.poolContributed')} value={formatMoney(pool.totalContributed, { compact: true })} />
        </View>

        <Text style={styles.explainer}>{t('pool.explainer')}</Text>

        <Text style={styles.sectionTitle}>{t('pool.businessList')}</Text>

        {pool.businesses.map((b) => (
          <View key={b._id} style={styles.business}>
            <View style={styles.businessHead}>
              <Text style={styles.businessName} numberOfLines={1}>
                {lang === 'hi' && b.nameHi ? b.nameHi : b.name}
              </Text>
              <Badge label={t(`pool.status.${b.status}`)} tone={STATUS_TONE[b.status] || 'muted'} />
            </View>
            <Text style={styles.businessMeta}>
              {[b.city, b.category, formatDate(b.fundedAt, lang)].filter(Boolean).join(' · ')}
            </Text>
            <View style={styles.businessFoot}>
              <Text style={styles.businessAmount}>{formatMoney(b.amountFunded)}</Text>
              {b.monthlyReturnPercent > 0 ? (
                <Text style={styles.businessReturn}>
                  {t('pool.monthlyReturn', { percent: b.monthlyReturnPercent })}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const DIAL = 210;

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { ...type.h1 },

  dialWrap: { alignItems: 'center', paddingVertical: spacing.md },
  dialOuter: {
    width: DIAL, height: DIAL, borderRadius: DIAL / 2,
    borderWidth: 2, borderColor: 'rgba(201,168,76,0.45)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card,
  },
  dialInner: {
    width: DIAL - 22, height: DIAL - 22, borderRadius: (DIAL - 22) / 2,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  dialLabel: { ...type.sectionLabel, fontSize: 10, textAlign: 'center' },
  dialValue: { fontFamily: type.price.fontFamily, fontSize: 38, color: colors.gold },
  dialHint: { ...type.tiny, color: colors.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardLabel: { ...type.label },
  cardValue: { fontFamily: type.price.fontFamily, fontSize: 16, color: colors.text },
  sharePercent: { fontFamily: type.price.fontFamily, fontSize: 20, color: colors.gold },
  cardHint: { ...type.tiny },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.bg, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 4 },

  statsGrid: { flexDirection: 'row', gap: spacing.md },
  explainer: { ...type.caption, lineHeight: 19 },
  sectionTitle: { ...type.sectionLabel, marginTop: spacing.sm },
  business: {
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.xs,
  },
  businessHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  businessName: { flex: 1, ...type.h3, fontSize: 15 },
  businessMeta: { ...type.tiny, color: colors.textMuted },
  businessFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  businessAmount: { fontFamily: type.price.fontFamily, fontSize: 15, color: colors.gold },
  businessReturn: { fontFamily: type.label.fontFamily, fontSize: 11, color: colors.success },
});
