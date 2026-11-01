import { Platform } from 'react-native';

/**
 * Native sign-in SDKs. Both need a development build (`npx expo run:ios` /
 * `run:android`); in Expo Go or on web the Google module is missing, so it is
 * required lazily and the caller gets a readable error instead of a crash.
 */

export class SocialAuthUnavailable extends Error {}

let googleConfigured = false;

function loadGoogle() {
  try {
    // eslint-disable-next-line global-require
    return require('@react-native-google-signin/google-signin');
  } catch {
    throw new SocialAuthUnavailable('Google sign-in needs a development build of the app.');
  }
}

/** Resolves to { idToken }, or null if the user backed out. */
export async function signInWithGoogle() {
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = loadGoogle();

  if (!googleConfigured) {
    GoogleSignin.configure({
      // The ID token's audience is the web client ID; the backend accepts it via GOOGLE_CLIENT_ID.
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
    googleConfigured = true;
  }

  try {
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return null;
    if (!res.data.idToken) throw new Error('Google did not return an ID token. Check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
    return { idToken: res.data.idToken };
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.IN_PROGRESS) return null;
    throw err;
  }
}

/** True only on iOS devices that support Sign in with Apple. */
export async function isAppleAvailable() {
  if (Platform.OS !== 'ios') return false;
  try {
    const AppleAuthentication = await import('expo-apple-authentication');
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Resolves to { idToken, name? }, or null if the user backed out. */
export async function signInWithApple() {
  const AppleAuthentication = await import('expo-apple-authentication');
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const { givenName, familyName } = credential.fullName || {};
    const name = [givenName, familyName].filter(Boolean).join(' ') || undefined;
    return { idToken: credential.identityToken, name };
  } catch (err) {
    if (err.code === 'ERR_REQUEST_CANCELED') return null;
    throw err;
  }
}
