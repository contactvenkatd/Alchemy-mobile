import { memo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar.js';
import { localized } from './ProductCard.js';
import { colors, radius, spacing, type } from '../theme/index.js';
import { formatMoney, timeAgo } from '../utils/format.js';

function Action({ icon, activeIcon, count, active, tint, onPress, label }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: true }}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons
        name={active ? activeIcon : icon}
        size={19}
        color={active ? tint : colors.textMuted}
      />
      <Text style={[styles.actionCount, active && { color: tint }]}>{count > 0 ? count : ''}</Text>
    </Pressable>
  );
}

function PostCardBase({ post, lang, t, onLike, onShare, onComment, onProductPress, onOpen }) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [sending, setSending] = useState(false);

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await onComment(post._id, text);
      setCommentText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <Pressable
      onPress={() => onOpen?.(post._id)}
      android_ripple={{ color: 'rgba(255,255,255,0.04)' }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <Avatar name={post.author?.name} uri={post.author?.avatarUrl} size={44} />
        <View style={styles.headerText}>
          <Text style={styles.author} numberOfLines={1}>{post.author?.name || '—'}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[post.author?.city, timeAgo(post.createdAt, lang)].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>

      {post.text ? <Text style={styles.text}>{post.text}</Text> : null}

      {post.images?.length ? (
        <Image source={{ uri: post.images[0] }} style={styles.image} resizeMode="cover" />
      ) : null}

      {post.taggedProducts?.map((product) => (
        <Pressable
          key={product._id}
          onPress={() => onProductPress(product)}
          android_ripple={{ color: 'rgba(201,168,76,0.15)' }}
          style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
        >
          <Text style={styles.pillText} numberOfLines={1}>
            {localized(product, 'title', lang)}
          </Text>
          <Text style={styles.pillPrice}>{formatMoney(product.price)}</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.gold} />
        </Pressable>
      ))}

      <View style={styles.actions}>
        <Action
          icon="heart-outline" activeIcon="heart" tint={colors.danger}
          count={post.likeCount} active={post.likedByMe}
          onPress={() => onLike(post._id)} label={t('feed.like')}
        />
        <Action
          icon="chatbubble-outline" activeIcon="chatbubble" tint={colors.gold}
          count={post.commentCount} active={showComments}
          onPress={() => setShowComments((v) => !v)} label={t('feed.comment')}
        />
        <Action
          icon="share-social-outline" activeIcon="share-social" tint={colors.gold}
          count={post.shareCount} onPress={() => onShare(post._id)} label={t('feed.share')}
        />
      </View>

      {showComments ? (
        <View style={styles.comments}>
          {post.comments?.map((c) => (
            <View key={c._id} style={styles.comment}>
              <Text style={styles.commentAuthor}>{c.author?.name || '—'}</Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          ))}
          <View style={styles.commentInputRow}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder={t('feed.writeComment')}
              placeholderTextColor={colors.textFaint}
              style={styles.commentInput}
              maxLength={500}
              onSubmitEditing={submitComment}
              returnKeyType="send"
            />
            <Pressable onPress={submitComment} style={styles.commentSend} disabled={sending} hitSlop={6}>
              <Ionicons name="send" size={18} color={colors.gold} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

// The feed re-renders on every like; memo keeps untouched rows cheap.
export const PostCard = memo(PostCardBase, (prev, next) => (
  prev.post === next.post && prev.lang === next.lang
));

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: { flex: 1, gap: 2 },
  author: { ...type.author },
  meta: { ...type.meta },
  text: { ...type.body },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.cardLift },

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
  pillText: { flexShrink: 1, ...type.pill },
  pillPrice: { fontFamily: type.price.fontFamily, fontSize: 13, color: colors.goldLight },

  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 32 },
  pressed: { opacity: 0.6 },
  cardPressed: { opacity: 0.95 },
  actionCount: { fontFamily: type.label.fontFamily, fontSize: 13, color: colors.textMuted, minWidth: 8 },

  comments: { gap: spacing.sm },
  comment: { backgroundColor: colors.cardLift, borderRadius: radius.md, padding: spacing.md, gap: 2 },
  commentAuthor: { fontFamily: type.author.fontFamily, fontSize: 12, color: colors.gold },
  commentText: { fontFamily: type.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.bodyText },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  commentInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    ...type.input,
    fontSize: 14,
    backgroundColor: colors.bg,
  },
  commentSend: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
