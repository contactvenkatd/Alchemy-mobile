/**
 * Extends app.json with the native auth plugins. The Google plugin refuses to
 * run without an iOS URL scheme, so it is only added once the client ID is set:
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=1234-abcd.apps.googleusercontent.com
 */
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export default ({ config }) => ({
  ...config,
  ios: { ...config.ios, usesAppleSignIn: true },
  plugins: [
    ...config.plugins,
    'expo-apple-authentication',
    './plugins/withSceneLifecycle',
    ...(googleIosClientId
      ? [['@react-native-google-signin/google-signin', {
        // The reversed client ID: com.googleusercontent.apps.1234-abcd
        iosUrlScheme: `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}`,
      }]]
      : []),
  ],
});
