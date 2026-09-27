import { useEffect } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen.js';
import { Button } from '../components/Button.js';
import { StatCard } from '../components/StatCard.js';
import { EmptyState } from '../components/EmptyState.js';
import { useWalletStore } from '../store/walletStore.js';
import { useAuthStore, useT } from '../store/authStore.js';
import { colors, radius, spacing, type } from '../theme/index.js';
import { formatMoney, timeAgo } from '../utils/format.js';

const TOPUP_OPTIONS = [50000, 100000, 200000]; // paise: ₹500 / ₹1,000 / ₹2,000

const TYPE_ICON = {
  purchase: 'bag-handle',
  seller_payout: 'storefront',
  referral_bonus: 'people',
  pool_contribution: 'trending-up',
  cashback: 'gift',
  topup: 'add-circle',
  pool_payout: 'cash',
};

function TransactionRow({ item, t, lang }) {
  const isCredit = item.direction === 'credit';
  const tint = isCredit ? colors.credit : colors.debit;
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: isCredit ? 'rgba(61,214,140,0.12)' : 'rgba(242,99,126,0.12)' }]}>
        <Ionicons name={TYPE_ICON[item.type] || 'ellipse'} size={17} color={tint} />
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>{t(`wallet.types.${item.type}`)}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {[item.product?.title, timeAgo(item.createdAt, lang)].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text style={[styles.rowAmount, { color: tint }]}>
        {isCredit ? '+' : '−'}{formatMoney(item.amount)}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const t = useT();
  const lang = useAuthStore((s) => s.language);
  const { summary, transactions, loadHistory, refreshAll, topup, loading, refreshing, error, hasMore } = useWalletStore();

  useEffect(() => { refreshAll(); }, []);

  const onTopup = () => {
    Alert.alert(
      t('wallet.addMoney'),
      '',
      [
        ...TOPUP_OPTIONS.map((amount) => ({
          text: formatMoney(amount),
          onPress: async () => {
            try {
              await topup(amount);
            } catch (err) {
              Alert.alert(t('common.error'), err.message);
            }
          },
        })),
        { text: t('common.cancel'), style: 'cancel' },
      ],
    );
  };

  // formatMoney already prefixes ₹; split it so the symbol can be gold.
  const balanceText = formatMoney(summary?.balance ?? 0).replace('₹', '');

  return (
    <Screen>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <TransactionRow item={item} t={t} lang={lang} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAll}
            tintColor={colors.gold}
            colors={[colors.gold]}
            progressBackgroundColor={colors.card}
          />
        }
        onEndReached={() => hasMore && loadHistory()}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.balanceLabel}>{t('wallet.balance')}</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.rupee}>₹</Text>
              <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit>{balanceText}</Text>
            </View>
            <Button title={t('wallet.addMoney')} variant="secondary" onPress={onTopup} style={styles.topupBtn} />

            <View style={styles.statsGrid}>
              <StatCard label={t('wallet.cashbackEarned')} value={formatMoney(summary?.cashback ?? 0)} tone="accent" />
              <StatCard label={t('wallet.referralEarned')} value={formatMoney(summary?.referralBonus ?? 0)} tone="accent" />
            </View>
            <View style={styles.statsGrid}>
              <StatCard label={t('wallet.poolContributed')} value={formatMoney(summary?.poolContributed ?? 0)} />
              <StatCard label={t('wallet.totalSpent')} value={formatMoney(summary?.totalSpent ?? 0)} />
            </View>

            <Text style={styles.sectionTitle}>{t('wallet.history')}</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            loading={loading && transactions.length === 0}
            error={error}
            message={t('wallet.noTransactions')}
            retryLabel={t('common.retry')}
            onRetry={refreshAll}
          />
        }
        initialNumToRender={10}
        windowSize={7}
        removeClippedSubviews
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xl },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  balanceLabel: { ...type.sectionLabel, textAlign: 'center' },
  balanceRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: spacing.xs },
  rupee: { fontFamily: type.price.fontFamily, fontSize: 30, color: colors.gold, marginTop: 10 },
  balanceValue: { ...type.priceHero },
  topupBtn: { alignSelf: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.xs },
  statsGrid: { flexDirection: 'row', gap: spacing.md },
  sectionTitle: { ...type.sectionLabel, marginTop: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: type.bodyStrong.fontFamily, fontSize: 14, color: colors.text },
  rowMeta: { ...type.tiny, color: colors.textMuted },
  rowAmount: { ...type.amount },
});
