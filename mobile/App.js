import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Syne_500Medium, Syne_700Bold } from '@expo-google-fonts/syne';
import { RootNavigator } from './src/navigation/RootNavigator.js';
import { useAuthStore } from './src/store/authStore.js';
import { colors } from './src/theme/index.js';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  // The keys here must match the family names in theme/index.js `fonts`.
  const [fontsLoaded, fontError] = useFonts({ Syne_500Medium, Syne_700Bold });

  useEffect(() => { bootstrap(); }, [bootstrap]);

  // Render nothing but the ground until the faces are in: text laid out in a
  // fallback and then reflowed is worse than a beat of nothing.
  // A font error still lets the app through — it degrades, it doesn't block.
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
