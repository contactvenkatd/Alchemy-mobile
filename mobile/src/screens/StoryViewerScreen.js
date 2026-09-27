import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Image, PanResponder, Pressable,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/Avatar.js';
import { useAuthStore } from '../store/authStore.js';
import { useStoryStore } from '../store/storyStore.js';
import { colors, spacing, type } from '../theme/index.js';
import { timeAgo } from '../utils/format.js';

const STORY_MS = 5000;
const SWIPE_CLOSE_DY = 110;

export default function StoryViewerScreen({ route, navigation }) {
  const lang = useAuthStore((s) => s.language);
  const { initialIndex = 0 } = route.params;
  const insets = useSafeAreaInsets();
  const stories = useStoryStore((s) => s.stories);
  const markSeen = useStoryStore((s) => s.markSeen);

  // A flat list of every item across every author, so next/prev can run off
  // the end of one story straight into the next without special cases.
  const flat = stories.flatMap((s, si) => s.items.map((item, ii) => ({ ...item, story: s, si, ii })));
  const startAt = flat.findIndex((f) => f.si === initialIndex);

  const [index, setIndex] = useState(startAt < 0 ? 0 : startAt);
  const progress = useRef(new Animated.Value(0)).current;
  const current = flat[index];

  const close = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const go = useCallback((delta) => {
    setIndex((i) => {
      const next = i + delta;
      if (next < 0) return 0;
      if (next >= flat.length) {
        close();
        return i;
      }
      return next;
    });
  }, [flat.length, close]);

  // Mark each author's story seen as it is reached.
  useEffect(() => {
    if (current?.story) markSeen(current.story.id);
  }, [current?.story?.id]);

  // Restart the timer whenever the visible item changes.
  useEffect(() => {
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_MS,
      // Width cannot be driven natively.
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) go(1);
    });
    return () => anim.stop();
  }, [index]);

  const pan = useRef(
    PanResponder.create({
      // Only claim the gesture once it is clearly a downward drag, so taps
      // still reach the left/right zones underneath.
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 12 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > SWIPE_CLOSE_DY) close();
      },
    }),
  ).current;

  if (!current) return null;

  const { width } = Dimensions.get('window');

  return (
    <View style={styles.root} {...pan.panHandlers}>
      <StatusBar hidden />
      <Image source={{ uri: current.image }} style={styles.image} resizeMode="cover" />

      <View style={[styles.bars, { top: insets.top + spacing.sm }]}>
        {flat.map((f, i) => (
          <View key={f.id} style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                i < index && styles.barDone,
                i === index && {
                  width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={[styles.header, { top: insets.top + spacing.xl }]}>
        <Avatar name={current.story.author.name} size={38} />
        <View style={styles.headerText}>
          <Text style={styles.author} numberOfLines={1}>{current.story.author.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[current.story.author.city, timeAgo(current.createdAt, lang)].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Pressable onPress={close} hitSlop={12} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
      </View>

      {/* Tap zones sit below the header so the X stays reachable. */}
      <View style={[styles.zones, { top: insets.top + 84 }]} pointerEvents="box-none">
        <Pressable style={[styles.zone, { width: width * 0.32 }]} onPress={() => go(-1)} />
        <Pressable style={styles.zoneRight} onPress={() => go(1)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bars: {
    position: 'absolute', left: spacing.md, right: spacing.md,
    flexDirection: 'row', gap: 4, zIndex: 3,
  },
  barTrack: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.gold, width: '0%' },
  barDone: { width: '100%' },
  header: {
    position: 'absolute', left: spacing.md, right: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, zIndex: 3,
  },
  headerText: { flex: 1, gap: 1 },
  author: { ...type.author, fontSize: 14 },
  meta: { ...type.tiny, color: colors.text, opacity: 0.75 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  // `top` is set inline from the safe-area inset so the zones start below
  // the close button rather than swallowing its taps.
  zones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 2 },
  zone: { height: '100%' },
  zoneRight: { flex: 1, height: '100%' },
});
