import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar.js';
import { colors, spacing, type } from '../theme/index.js';

const SIZE = 64;

/** Ring colour is the whole signal: gold = unseen, grey = already watched. */
function Ring({ seen, children }) {
  return (
    <View style={[styles.ring, { borderColor: seen ? colors.border : colors.gold }]}>
      {children}
    </View>
  );
}

export function StoriesRow({ stories, currentUserName, onOpen, onAddOwn }) {
  return (
    <FlatList
      horizontal
      data={stories}
      keyExtractor={(s) => s.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      ListHeaderComponent={
        <Pressable onPress={onAddOwn} style={styles.item} accessibilityRole="button">
          <View style={[styles.ring, styles.ownRing]}>
            <Avatar name={currentUserName} size={SIZE - 8} ring={false} />
            <View style={styles.plus}>
              <Ionicons name="add" size={13} color={colors.onGold} />
            </View>
          </View>
          <Text style={styles.name} numberOfLines={1}>Your Story</Text>
        </Pressable>
      }
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => onOpen(index)}
          style={styles.item}
          accessibilityRole="button"
          accessibilityLabel={`${item.author.name} story`}
        >
          <Ring seen={item.seen}>
            <Avatar name={item.author.name} size={SIZE - 8} ring={false} />
          </Ring>
          <Text style={[styles.name, item.seen && styles.nameSeen]} numberOfLines={1}>
            {item.author.name.split(' ')[0]}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.md },
  item: { width: SIZE + 8, alignItems: 'center', gap: spacing.xs },
  ring: {
    width: SIZE, height: SIZE, borderRadius: SIZE / 2,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card,
  },
  ownRing: { borderColor: colors.border, borderStyle: 'dashed' },
  plus: {
    position: 'absolute', right: -2, bottom: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  name: { ...type.tiny, fontSize: 11, color: colors.text, maxWidth: SIZE + 8, textAlign: 'center' },
  nameSeen: { color: colors.textMuted },
});
