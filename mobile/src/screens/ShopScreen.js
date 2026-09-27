import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen.js';
import { ProductCard } from '../components/ProductCard.js';
import { EmptyState } from '../components/EmptyState.js';
import { useShopStore } from '../store/shopStore.js';
import { useAuthStore, useT } from '../store/authStore.js';
import { colors, radius, spacing, type } from '../theme/index.js';

const SORTS = [
  { key: 'new', labelKey: 'shop.sortNew' },
  { key: 'price_asc', labelKey: 'shop.sortPriceAsc' },
  { key: 'price_desc', labelKey: 'shop.sortPriceDesc' },
  { key: 'rating', labelKey: 'shop.sortRating' },
];

function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

export default function ShopScreen({ navigation }) {
  const t = useT();
  const lang = useAuthStore((s) => s.language);
  const { products, categories, filters, setFilter, load, loadCategories, loading, refreshing, error, hasMore } = useShopStore();
  const [query, setQuery] = useState(filters.q);

  useEffect(() => {
    if (products.length === 0) load({ refresh: true });
    loadCategories();
  }, []);

  // Debounce so a slow network isn't hit on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      if (query !== filters.q) setFilter({ q: query });
    }, 400);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('shop.title')}</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={17} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('shop.search')}
            placeholderTextColor={colors.textFaint}
            style={styles.search}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterRow}>
        <Chip label={t('shop.all')} active={!filters.category} onPress={() => setFilter({ category: '' })} />
        {categories.map((c) => (
          <Chip
            key={c.key}
            label={`${c.key} ${c.count}`}
            active={filters.category === c.key}
            onPress={() => setFilter({ category: c.key })}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterRow}>
        {SORTS.map((s) => (
          <Chip key={s.key} label={t(s.labelKey)} active={filters.sort === s.key} onPress={() => setFilter({ sort: s.key })} />
        ))}
      </ScrollView>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            lang={lang}
            t={t}
            onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load({ refresh: true })}
            tintColor={colors.gold}
            colors={[colors.gold]}
            progressBackgroundColor={colors.card}
          />
        }
        onEndReached={() => hasMore && load()}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            loading={loading && products.length === 0}
            error={error}
            message={t('common.empty')}
            retryLabel={t('common.retry')}
            onRetry={() => load({ refresh: true })}
          />
        }
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.md },
  title: { ...type.h1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 46,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  search: { flex: 1, ...type.input, fontSize: 15, minHeight: 46 },
  filterBar: { flexGrow: 0 },
  filterRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.goldSoft, borderColor: 'rgba(201,168,76,0.45)' },
  chipText: { ...type.chip, textTransform: 'capitalize' },
  chipTextActive: { color: colors.gold },
  grid: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  column: { gap: spacing.md },
});
