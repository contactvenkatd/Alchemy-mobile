import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from './Badge.js';
import { GradientButton } from './GradientButton.js';
import { colors, radius, spacing, type } from '../theme/index.js';
import { formatMoney } from '../utils/format.js';

/** Picks the Hindi field when the UI is in Hindi and the seller supplied one. */
export function localized(item, field, lang) {
  const hiKey = `${field}Hi`;
  if (lang === 'hi' && item?.[hiKey]) return item[hiKey];
  return item?.[field] || '';
}

export function ProductCard({ product, lang, t, onPress, onBuy, compact = false }) {
  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  const outOfStock = product.stock <= 0;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.images?.[0] || 'https://picsum.photos/seed/placeholder/400/400' }}
          style={[styles.image, compact && styles.compactImage]}
          resizeMode="cover"
        />
        {discount > 0 ? (
          <View style={styles.discount}><Text style={styles.discountText}>{discount}% OFF</Text></View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{localized(product, 'title', lang)}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatMoney(product.price)}</Text>
          {discount > 0 ? <Text style={styles.mrp}>{formatMoney(product.mrp)}</Text> : null}
        </View>

        {product.cashbackPercent > 0 ? (
          <Badge label={t('shop.cashback', { percent: product.cashbackPercent })} />
        ) : null}

        {!compact ? (
          <GradientButton
            size="sm"
            title={outOfStock ? t('shop.outOfStock') : t('shop.buyNow')}
            disabled={outOfStock}
            onPress={onBuy || onPress}
            style={styles.buy}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  compact: { width: 150, flex: 0 },
  pressed: { opacity: 0.85 },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.cardLift },
  compactImage: { aspectRatio: 1.2 },
  discount: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  discountText: { fontFamily: type.price.fontFamily, fontSize: 10, color: colors.onGold },
  body: { padding: spacing.md, gap: spacing.sm },
  title: { fontFamily: type.bodyStrong.fontFamily, fontSize: 14, color: colors.text, lineHeight: 19 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' },
  price: { ...type.price },
  mrp: { ...type.caption, color: colors.textFaint, textDecorationLine: 'line-through' },
  buy: { marginTop: spacing.xs },
});
