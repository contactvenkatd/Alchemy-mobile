import { Platform, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import FeedScreen from '../screens/FeedScreen.js';
import ShopScreen from '../screens/ShopScreen.js';
import WalletScreen from '../screens/WalletScreen.js';
import PoolScreen from '../screens/PoolScreen.js';
import ProfileScreen from '../screens/ProfileScreen.js';
import { useT } from '../store/authStore.js';
import { colors, MAX_WIDTH, radius, type } from '../theme/index.js';

const Tab = createBottomTabNavigator();

const ICONS = {
  Feed: ['home-outline', 'home'],
  Shop: ['grid-outline', 'grid'],
  Wallet: ['wallet-outline', 'wallet'],
  Pool: ['trending-up-outline', 'trending-up'],
  Profile: ['person-outline', 'person'],
};

/** The gold bar above the active icon is the only active-state chrome. */
function TabIcon({ name, focused }) {
  const [outline, solid] = ICONS[name];
  return (
    <View style={styles.icon}>
      <View style={[styles.indicator, focused && styles.indicatorOn]} />
      <Ionicons name={focused ? solid : outline} size={22} color={focused ? colors.text : colors.textMuted} />
    </View>
  );
}

export function TabNavigator() {
  const t = useT();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
        tabBarBackground: () => <View style={styles.barBg} />,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: t('tabs.feed') }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ title: t('tabs.shop') }} />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ title: t('tabs.wallet') }} />
      <Tab.Screen name="Pool" component={PoolScreen} options={{ title: t('tabs.pool') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: Platform.OS === 'ios' ? 84 : 66,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
    backgroundColor: colors.bg,
    // The default bar draws a hairline top border; replace it with nothing.
    borderTopWidth: 0,
    elevation: 0,
    // Keep the bar on the same phone-width column as the screens.
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_WIDTH,
  },
  barBg: { flex: 1, backgroundColor: colors.bg },
  item: { paddingTop: 2 },
  label: { ...type.navLabel },
  icon: { alignItems: 'center', justifyContent: 'center', gap: 5 },
  indicator: { width: 18, height: 2.5, borderRadius: radius.pill, backgroundColor: 'transparent' },
  indicatorOn: { backgroundColor: colors.gold },
});
