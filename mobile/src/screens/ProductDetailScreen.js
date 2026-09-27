import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen.js';
import { Header } from '../components/Header.js';
import { GradientButton } from '../components/GradientButton.js';
import { Badge } from '../components/Badge.js';
import { EmptyState } from '../components/EmptyState.js';
import { localized } from '../components/ProductCard.js';
import { productApi } from '../api/endpoints.js';
import { useWalletStore } from '../store/walletStore.js';
import { useShopStore } from '../store/shopStore.js';
import { useAuthStore, useT } from '../store/authStore.js';
import { colors, radius, spacing, type } from '../theme/index.js';
import { formatMoney } from '../utils/format.js';

export default function ProductDetailScreen({ route, navigation }) {
  const t = useT();
  const lang = useAuthStore((s) => s.language);
  const balance = useAuthStore((s) => s.user?.walletBalance ?? 0);
  const purchase = useWalletStore((s) => s.purchase);
  const decrementStock = useShopStore((s) => s.decrementStock);

  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [buying, setBuying] = useState(false);
  const [qty, setQty] = useState(1);
  const insets = useSafeAreaInsets();

  const fetchProduct = async () => {
    setError(null);
    try {
      const res = await productApi.get(route.params.productId);
      setProduct(res.product);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { fetchProduct(); }, [route.params.productId]);

  const total = product ? product.price * qty : 0;

  const onBuy = () => {
    if (total > balance) {
      return Alert.alert(t('shop.lowBalance'), `${t('wallet.balance')}: ${formatMoney(balance)}`);
    }
    Alert.alert(
      t('shop.confirmTitle'),
      t('shop.confirmBody', { amount: formatMoney(total) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('shop.buyNow'), onPress: confirmBuy },
      ],
    );
  };

  const confirmBuy = async () => {
    setBuying(true);
    try {
      const res = await purchase(product._id, qty);
      decrementStock(product._id, qty);
      setProduct((p) => ({ ...p, stock: p.stock - qty }));
      Alert.alert(
        t('shop.purchaseDone'),
        t('shop.purchaseSplit', {
          seller: formatMoney(res.split.seller),
          referrer: formatMoney(res.split.referrer),
          pool: formatMoney(res.split.pool),
        }),
      );
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setBuying(false);
    }
  };

  if (!product) {
    return (
      <Screen edges={[]}>
        <Header title="" onBack={() => navigation.goBack()} />
        <EmptyState loading={!error} error={error} retryLabel={t('common.retry')} onRetry={fetchProduct} />
      </Screen>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <Screen edges={[]}>
      <Header title={localized(product, 'title', lang)} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={{ uri: product.images?.[0] || 'https://picsum.photos/seed/placeholder/600/600' }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.body}>
          <Text style={styles.title}>{localized(product, 'title', lang)}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMoney(product.price)}</Text>
            {product.mrp > product.price ? <Text style={styles.mrp}>{formatMoney(product.mrp)}</Text> : null}
            {product.cashbackPercent > 0 ? (
              <Badge label={t('shop.cashback', { percent: product.cashbackPercent })} />
            ) : null}
          </View>

          <Text style={styles.meta}>
            {t('shop.by', { name: product.seller?.name || '—' })}
            {product.city ? ` · ${product.city}` : ''}
            {product.ratingCount > 0 ? ` · ★ ${product.rating} (${product.ratingCount})` : ''}
          </Text>

          {localized(product, 'description', lang) ? (
            <Text style={styles.description}>{localized(product, 'description', lang)}</Text>
          ) : null}

          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Qty</Text>
            <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn} hitSlop={6}>
              <Ionicons name="remove" size={18} color={colors.gold} />
            </Pressable>
            <Text style={styles.qtyValue}>{qty}</Text>
            <Pressable onPress={() => setQty((q) => Math.min(product.stock || 1, q + 1))} style={styles.qtyBtn} hitSlop={6}>
              <Ionicons name="add" size={18} color={colors.gold} />
            </Pressable>
            <Text style={styles.stock}>
              {outOfStock ? t('shop.outOfStock') : t('shop.inStock', { count: product.stock })}
            </Text>
          </View>

          {/* Shows the buyer exactly where their money goes — the core promise of the app. */}
          <View style={styles.splitBox}>
            <Text style={styles.splitTitle}>{t('pool.explainer')}</Text>
            <View style={styles.splitRow}>
              <Text style={styles.splitItem}>90% → {product.seller?.name || '—'}</Text>
              <Text style={styles.splitItem}>5% → {t('profile.referrals')}</Text>
              <Text style={styles.splitItem}>5% → {t('pool.fundBalance')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerLabel}>{t('wallet.balance')}</Text>
          <Text style={styles.footerValue}>{formatMoney(balance)}</Text>
        </View>
        <GradientButton
          title={outOfStock ? t('shop.outOfStock') : `${t('shop.buyNow')} · ${formatMoney(total)}`}
          onPress={onBuy}
          disabled={outOfStock}
          loading={buying}
          style={styles.buyBtn}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.card },
  body: { padding: spacing.lg, gap: spacing.md },
  title: { ...type.h2, lineHeight: 28 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  price: { ...type.priceLg },
  mrp: { fontFamily: type.body.fontFamily, fontSize: 15, color: colors.textFaint, textDecorationLine: 'line-through' },
  meta: { ...type.meta, fontSize: 13 },
  description: { ...type.body },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  qtyLabel: { ...type.label },
  qtyBtn: {
    width: 40, height: 40, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyValue: { fontFamily: type.price.fontFamily, fontSize: 17, color: colors.text, minWidth: 24, textAlign: 'center' },
  stock: { ...type.tiny, color: colors.textMuted, flex: 1, textAlign: 'right' },
  splitBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  splitTitle: { ...type.caption, lineHeight: 19 },
  splitRow: { gap: 3 },
  splitItem: { fontFamily: type.pill.fontFamily, fontSize: 12, color: colors.gold },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  footerTotal: { minWidth: 86 },
  footerLabel: { fontFamily: type.label.fontFamily, fontSize: 10, color: colors.textMuted, letterSpacing: 0.4 },
  footerValue: { fontFamily: type.price.fontFamily, fontSize: 16, color: colors.text },
  buyBtn: { flex: 1 },
});
