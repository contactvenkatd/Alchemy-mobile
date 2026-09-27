import { useCallback, useEffect } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen.js';
import { PostCard } from '../components/PostCard.js';
import { StoriesRow } from '../components/StoriesRow.js';
import { EmptyState } from '../components/EmptyState.js';
import { MOCK_CONVERSATIONS } from '../data/mockConversations.js';
import { useFeedStore } from '../store/feedStore.js';
import { useStoryStore } from '../store/storyStore.js';
import { useAuthStore, useT } from '../store/authStore.js';
import { colors, spacing, type } from '../theme/index.js';

export default function FeedScreen({ navigation }) {
  const t = useT();
  const lang = useAuthStore((s) => s.language);
  const userName = useAuthStore((s) => s.user?.name);
  const { posts, load, toggleLike, addComment, share, loading, refreshing, error, hasMore } = useFeedStore();

  // Stories are local mock data until there is an API for them.
  const stories = useStoryStore((s) => s.stories);
  const unreadDms = MOCK_CONVERSATIONS.reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0);

  useEffect(() => {
    if (posts.length === 0) load({ refresh: true });
  }, []);

  // Only a plain index crosses the navigation boundary.
  const openStory = useCallback((index) => {
    navigation.navigate('StoryViewer', { initialIndex: index });
  }, [navigation]);

  const onShare = useCallback(async (postId) => {
    try {
      const res = await share(postId);
      await Clipboard.setStringAsync(res.shareUrl);
      Alert.alert(t('feed.shared'), res.shareUrl);
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    }
  }, [share, t]);

  const onProductPress = useCallback((product) => {
    navigation.navigate('ProductDetail', { productId: product._id });
  }, [navigation]);

  const onOpenPost = useCallback((postId) => {
    navigation.navigate('PostDetail', { postId });
  }, [navigation]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.wordmark}>Alchemy</Text>
          <Pressable
            onPress={() => navigation.navigate('Messages')}
            hitSlop={10}
            style={styles.dmButton}
            accessibilityRole="button"
            accessibilityLabel="Messages"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={23} color={colors.text} />
            {unreadDms > 0 ? (
              <View style={styles.dmBadge}><Text style={styles.dmBadgeText}>{unreadDms}</Text></View>
            ) : null}
          </Pressable>
        </View>
        <View style={styles.rule} />
        <Text style={styles.headerSub}>{t('feed.title')}</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <StoriesRow
            stories={stories}
            currentUserName={userName}
            onOpen={openStory}
            onAddOwn={() => Alert.alert('Your Story', 'Story capture is not built yet.')}
          />
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            lang={lang}
            t={t}
            onLike={toggleLike}
            onShare={onShare}
            onComment={addComment}
            onProductPress={onProductPress}
            onOpen={onOpenPost}
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
            loading={loading && posts.length === 0}
            error={error}
            message={t('common.empty')}
            retryLabel={t('common.retry')}
            onRetry={() => load({ refresh: true })}
          />
        }
        // Tuned for low-RAM Android: keep few rows mounted.
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  headerMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { ...type.wordmark },
  dmButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  dmBadge: {
    position: 'absolute', top: 4, right: 2,
    minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.bg,
  },
  dmBadgeText: { fontFamily: type.price.fontFamily, fontSize: 10, color: colors.onGold },
  rule: { width: 44, height: 2, backgroundColor: colors.gold, borderRadius: 1, marginTop: spacing.sm },
  headerSub: { ...type.label, fontSize: 12, letterSpacing: 0.5, marginTop: spacing.sm },
  list: { paddingTop: spacing.xs, paddingBottom: spacing.xl },
});
