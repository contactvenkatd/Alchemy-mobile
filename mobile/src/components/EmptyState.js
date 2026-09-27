import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button.js';
import { colors, spacing, type } from '../theme/index.js';

export function EmptyState({ loading, error, message, onRetry, retryLabel = 'Retry' }) {
  return (
    <View style={styles.wrap}>
      {loading ? <ActivityIndicator color={colors.gold} /> : null}
      {!loading ? <Text style={styles.text}>{error || message}</Text> : null}
      {!loading && error && onRetry ? (
        <Button title={retryLabel} variant="ghost" onPress={onRetry} full={false} style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  text: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  btn: { paddingHorizontal: spacing.xl },
});
