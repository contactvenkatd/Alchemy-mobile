import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen.js';
import { Header, HEADER_BAR_HEIGHT } from '../components/Header.js';
import { Avatar } from '../components/Avatar.js';
import { EmptyState } from '../components/EmptyState.js';
import { localized } from '../components/ProductCard.js';
import { postApi } from '../api/endpoints.js';
import { useFeedStore } from '../store/feedStore.js';
import { useAuthStore, useT } from '../store/authStore.js';
import { colors, radius, spacing, type } from '../theme/index.js';
import { formatMoney, timeAgo } from '../utils/format.js';

export default function PostDetailScreen({ route, navigation }) {
  const t = useT();
  const lang = useAuthStore((s) => s.language);
  const syncComment = useFeedStore((s) => s.applyComment);

  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();

  const fetchPost = async () => {
    setError(null);
    try {
      const res = await postApi.get(route.params.postId);
      setPost(res.post);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { fetchPost(); }, [route.params.postId]);

  const submit = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await postApi.comment(post._id, body);
      setPost((p) => ({ ...p, comments: [...p.comments, res.comment], commentCount: res.commentCount }));
      // Keep the feed row's count in step with what was just posted here.
      syncComment(post._id, res.comment, res.commentCount);
      setText('');
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!post) {
    return (
      <Screen edges={[]}>
        <Header title="Post" onBack={() => navigation.goBack()} />
        <EmptyState loading={!error} error={error} retryLabel={t('common.retry')} onRetry={fetchPost} />
      </Screen>
    );
  }

  const header = (
    <View>
      {post.images?.length ? (
        <Image source={{ uri: post.images[0] }} style={styles.hero} resizeMode="cover" />
      ) : null}

      <View style={styles.body}>
        <View style={styles.authorRow}>
          <Avatar name={post.author?.name} uri={post.author?.avatarUrl} size={46} />
          <View style={styles.authorText}>
            <Text style={styles.author} numberOfLines={1}>{post.author?.name || '—'}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {[post.author?.city, timeAgo(post.createdAt, lang)].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>

        {post.text ? <Text style={styles.text}>{post.text}</Text> : null}

        {post.taggedProducts?.map((product) => (
          <Pressable
            key={product._id}
            onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
            android_ripple={{ color: 'rgba(201,168,76,0.15)' }}
            style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
          >
            <Text style={styles.pillText} numberOfLines={1}>{localized(product, 'title', lang)}</Text>
            <Text style={styles.pillPrice}>{formatMoney(product.price)}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.gold} />
          </Pressable>
        ))}

        <View style={styles.counts}>
          <Text style={styles.countItem}>{post.likeCount} {t('feed.like')}</Text>
          <Text style={styles.countItem}>{post.commentCount} {t('feed.comment')}</Text>
          <Text style={styles.countItem}>{post.shareCount} {t('feed.share')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('feed.comment')}</Text>
      </View>
    </View>
  );

  return (
    <Screen edges={[]}>
      <Header title="Post" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + HEADER_BAR_HEIGHT : 0}
      >
        <FlatList
          ref={listRef}
          data={post.comments}
          keyExtractor={(c) => c._id}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.comment}>
              <Avatar name={item.author?.name} uri={item.author?.avatarUrl} size={34} />
              <View style={styles.commentBody}>
                <Text style={styles.commentAuthor} numberOfLines={1}>{item.author?.name || '—'}</Text>
                <Text style={styles.commentText}>{item.text}</Text>
                <Text style={styles.commentTime}>{timeAgo(item.createdAt, lang)}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.noComments}>{t('common.empty')}</Text>}
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('feed.writeComment')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            maxLength={500}
            onSubmitEditing={submit}
            returnKeyType="send"
          />
          <Pressable
            onPress={submit}
            disabled={sending || !text.trim()}
            style={[styles.send, (sending || !text.trim()) && styles.sendOff]}
            accessibilityRole="button"
            accessibilityLabel={t('feed.post')}
          >
            {sending
              ? <ActivityIndicator size="small" color={colors.onGold} />
              : <Ionicons name="send" size={18} color={colors.onGold} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingBottom: spacing.lg },
  hero: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.card },
  body: { padding: spacing.lg, gap: spacing.md },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  authorText: { flex: 1, gap: 2 },
  author: { ...type.author },
  meta: { ...type.meta },
  text: { ...type.body },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
  },
  pressed: { opacity: 0.7 },
  pillText: { flexShrink: 1, ...type.pill },
  pillPrice: { fontFamily: type.price.fontFamily, fontSize: 13, color: colors.goldLight },
  counts: {
    flexDirection: 'row',
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  countItem: { ...type.caption },
  sectionTitle: { ...type.sectionLabel, marginTop: spacing.xs },
  comment: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  commentBody: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  commentAuthor: { fontFamily: type.author.fontFamily, fontSize: 13, color: colors.text },
  commentText: { ...type.body, fontSize: 14, lineHeight: 20 },
  commentTime: { ...type.tiny, marginTop: 2 },
  noComments: { ...type.caption, textAlign: 'center', paddingVertical: spacing.lg },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg,
    ...type.input,
    fontSize: 14,
  },
  send: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  sendOff: { opacity: 0.4 },
});
