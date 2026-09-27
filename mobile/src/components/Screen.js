import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, MAX_WIDTH } from '../theme/index.js';

/**
 * Every screen sits inside this: dark ground edge to edge, with the content
 * constrained to a phone-width column and centred. On a desktop browser that
 * reads as a phone preview instead of a stretched-out web page.
 */
export function Screen({ children, style, edges = ['top'] }) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={styles.center}>
        <View style={[styles.body, style]}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', backgroundColor: colors.bg },
  body: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, backgroundColor: colors.bg },
});
