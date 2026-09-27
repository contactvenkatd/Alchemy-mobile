import { useMemo, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen.js';
import { Header, HEADER_BAR_HEIGHT } from '../components/Header.js';
import { MOCK_CONVERSATIONS } from '../data/mockConversations.js';
import { useAuthStore, useT } from '../store/authStore.js';
import { colors, radius, spacing, type } from '../theme/index.js';
import { timeAgo } from '../utils/format.js';

export default function ChatScreen({ route, navigation }) {
  const t = useT();
  const lang = useAuthStore((s) => s.language);
  const conversation = useMemo(
    () => MOCK_CONVERSATIONS.find((c) => c.id === route.params.conversationId),
    [route.params.conversationId],
  );

  // Local only: there is no messages API yet, so a sent message lives for as
  // long as this screen does.
  const [messages, setMessages] = useState(conversation?.messages ?? []);
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();

  const send = () => {
    const body = text.trim();
    if (!body) return;
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, text: body, mine: true, at: new Date().toISOString() },
    ]);
    setText('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  if (!conversation) return <Screen edges={[]} />;

  return (
    <Screen edges={[]}>
      <Header title={conversation.peer.name} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        // Distance from the top of this view to the top of the window: the
        // status bar inset plus the header we just drew.
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + HEADER_BAR_HEIGHT : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, item.mine ? styles.rowMine : styles.rowTheirs]}>
              <View style={[styles.bubble, item.mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.text, item.mine && styles.textMine]}>{item.text}</Text>
                <Text style={[styles.time, item.mine && styles.timeMine]}>{timeAgo(item.at, lang)}</Text>
              </View>
            </View>
          )}
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('feed.writeComment')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            maxLength={1000}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            onPress={send}
            disabled={!text.trim()}
            style={[styles.send, !text.trim() && styles.sendOff]}
            accessibilityRole="button"
            accessibilityLabel={t('feed.post')}
          >
            <Ionicons name="send" size={18} color={colors.onGold} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.sm },
  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: 3 },
  mine: {
    backgroundColor: colors.gold,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: 4,
  },
  theirs: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderBottomLeftRadius: 4,
  },
  text: { ...type.body, fontSize: 14, lineHeight: 20, color: colors.text },
  textMine: { color: colors.onGold },
  time: { ...type.tiny, fontSize: 10 },
  timeMine: { color: colors.onGold, opacity: 0.7 },
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
