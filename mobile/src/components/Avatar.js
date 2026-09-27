import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/index.js';
import { initials } from '../utils/format.js';

/** `ring` draws the gold halo used on feed authors and the profile header. */
export function Avatar({ name, uri, size = 40, ring = true }) {
  const inner = size - (ring ? 4 : 0);
  const dim = { width: inner, height: inner, borderRadius: inner / 2 };

  const content = uri
    ? <Image source={{ uri }} style={[styles.img, dim]} />
    : (
      <View style={[styles.fallback, dim]}>
        <Text style={[styles.text, { fontSize: inner * 0.38 }]}>{initials(name)}</Text>
      </View>
    );

  if (!ring) return content;

  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: colors.card,
  },
  img: { backgroundColor: colors.cardLift },
  fallback: { backgroundColor: colors.cardLift, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.gold, fontFamily: fonts.bold },
});
