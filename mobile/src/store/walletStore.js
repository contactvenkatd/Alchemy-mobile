import { create } from 'zustand';
import { walletApi, poolApi } from '../api/endpoints.js';
import { useAuthStore } from './authStore.js';

export const useWalletStore = create((set, get) => ({
  summary: null,
  transactions: [],
  page: 1,
  hasMore: true,
  loading: false,
  refreshing: false,
  error: null,

  loadSummary: async () => {
    try {
      const summary = await walletApi.summary();
      set({ summary });
      useAuthStore.getState().updateUser({ walletBalance: summary.balance });
    } catch (err) {
      set({ error: err.message });
    }
  },

  loadHistory: async ({ refresh = false } = {}) => {
    const { loading, hasMore, page } = get();
    if (loading || (!refresh && !hasMore)) return;

    const nextPage = refresh ? 1 : page;
    set(refresh ? { refreshing: true, error: null } : { loading: true, error: null });

    try {
      const res = await walletApi.history(nextPage);
      set((state) => ({
        transactions: refresh ? res.items : [...state.transactions, ...res.items],
        page: nextPage + 1,
        hasMore: res.hasMore,
        loading: false,
        refreshing: false,
      }));
    } catch (err) {
      set({ loading: false, refreshing: false, error: err.message });
    }
  },

  refreshAll: async () => {
    await Promise.all([get().loadSummary(), get().loadHistory({ refresh: true })]);
  },

  topup: async (amountPaise) => {
    const res = await walletApi.topup(amountPaise);
    useAuthStore.getState().updateUser({ walletBalance: res.balance });
    await get().refreshAll();
    return res;
  },

  purchase: async (productId, quantity = 1) => {
    const res = await walletApi.purchase(productId, quantity);
    useAuthStore.getState().updateUser({
      walletBalance: res.walletBalance,
      poolUnits: res.poolUnits,
    });
    await get().refreshAll();
    return res;
  },
}));

export const usePoolStore = create((set) => ({
  pool: null,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const pool = await poolApi.get();
      set({ pool, loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },
}));
