import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, userApi } from '../api/endpoints.js';
import { setAuthToken } from '../api/client.js';
import { translate, DEFAULT_LANGUAGE } from '../i18n/index.js';

const TOKEN_KEY = 'alchemy.token';
const LANG_KEY = 'alchemy.lang';

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  language: DEFAULT_LANGUAGE,
  booting: true,
  loading: false,
  error: null,

  /** Restores the session on cold start. */
  bootstrap: async () => {
    try {
      const [token, lang] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(LANG_KEY),
      ]);
      if (lang) set({ language: lang });
      if (!token) return set({ booting: false });

      setAuthToken(token);
      const { user } = await authApi.me();
      set({ token, user, language: lang || user.language || DEFAULT_LANGUAGE, booting: false });
    } catch {
      // Token expired or the API is unreachable — start signed out.
      setAuthToken(null);
      await AsyncStorage.removeItem(TOKEN_KEY);
      set({ token: null, user: null, booting: false });
    }
  },

  requestOtp: async (phone, referralCode) => {
    set({ loading: true, error: null });
    try {
      const res = await authApi.requestOtp(phone, referralCode);
      set({ loading: false });
      return res;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  verifyOtp: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authApi.verifyOtp({ ...payload, language: get().language });
      setAuthToken(token);
      await AsyncStorage.setItem(TOKEN_KEY, token);
      set({ token, user, loading: false });
      return user;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  setLanguage: async (language) => {
    set({ language });
    await AsyncStorage.setItem(LANG_KEY, language);
    if (get().token) {
      try {
        await userApi.updateProfile({ language });
      } catch {
        // Language is a local preference first; a failed sync is not fatal.
      }
    }
  },

  updateUser: (patch) => set((state) => ({ user: { ...state.user, ...patch } })),

  logout: async () => {
    setAuthToken(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null });
  },

  clearError: () => set({ error: null }),
}));

/** Convenience hook: t('shop.buyNow') in the current language. */
export function useT() {
  const language = useAuthStore((s) => s.language);
  return (path, vars) => translate(language, path, vars);
}
