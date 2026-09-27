import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen.js';
import OtpScreen from '../screens/auth/OtpScreen.js';
import ProductDetailScreen from '../screens/ProductDetailScreen.js';
import PostDetailScreen from '../screens/PostDetailScreen.js';
import StoryViewerScreen from '../screens/StoryViewerScreen.js';
import MessagesScreen from '../screens/MessagesScreen.js';
import ChatScreen from '../screens/ChatScreen.js';
import { TabNavigator } from './TabNavigator.js';
import { useAuthStore } from '../store/authStore.js';
import { colors } from '../theme/index.js';

const Stack = createNativeStackNavigator();

/** Without this the navigator paints a white card behind every transition. */
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.gold,
  },
};

export function RootNavigator() {
  const token = useAuthStore((s) => s.token);
  const booting = useAuthStore((s) => s.booting);

  if (booting) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          // Screens render the shared <Header/> themselves so the back target,
          // safe area and max-width column match the rest of the app.
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {token ? (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen
              name="StoryViewer"
              component={StoryViewerScreen}
              options={{ presentation: 'fullScreenModal', animation: 'fade' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Otp" component={OtpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
