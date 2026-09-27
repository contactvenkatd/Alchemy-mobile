import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen.js';
import { Header } from '../components/Header.js';
import { Avatar } from '../components/Avatar.js';
import { EmptyState } from '../components/EmptyState.js';
import { MOCK_CONVERSATIONS } from '../data/mockConversations.js';
import { useAuthStore, useT } from '../store/authStore.js';
import { colors, radius, spacing, type } from '../theme/index.js';
import { timeAgo } from '../utils/format.js';

export default function MessagesScreen({ navigation }) {
  const t = useT();
  const lang = useAuthStore((s) => s.language);

  return (
    <Screen edges={['bottom']}>
      <Header title="Messages" onBack={() => navigation.goBack()} />
      <FlatList
        data={MOCK_CONVERSATIONS}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const last = item.messages.at(-1);
          return (
            <Pressable
              onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
              android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <Avatar name={item.peer.name} size={50} ring={item.unread > 0} />
              <View style={styles.body}>
                <Text style={styles.name} numberOfLines={1}>{item.peer.name}</Text>
                <Text style={[styles.preview, item.unread > 0 && styles.previewUnread]} numberOfLines={1}>
                  {last?.mine ? 'You: ' : ''}{last?.text || ''}
                </Text>
              </View>
              <View style={styles.side}>
                <Text style={styles.time}>{last ? timeAgo(last.at, lang) : ''}</Text>
                {item.unread > 0 ? (
                  <View style={styles.badge}><Text style={styles.badgeText}>{item.unread}</Text></View>
                ) : null}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={<EmptyState message={t('common.empty')} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  pressed: { opacity: 0.85 },
  body: { flex: 1, gap: 3 },
  name: { fontFamily: type.author.fontFamily, fontSize: 15, color: colors.text },
  preview: { ...type.caption },
  previewUnread: { color: colors.text },
  side: { alignItems: 'flex-end', gap: spacing.xs },
  time: { ...type.tiny },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontFamily: type.price.fontFamily, fontSize: 11, color: colors.onGold },
});
