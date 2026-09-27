import { create } from 'zustand';
import { productApi } from '../api/endpoints.js';

const initialFilters = { q: '', category: '', sort: 'new', minPrice: '', maxPrice: '' };

export const useShopStore = create((set, get) => ({
  products: [],
  categories: [],
  filters: { ...initialFilters },
  page: 1,
  hasMore: true,
  loading: false,
  refreshing: false,
  error: null,

  setFilter: (patch) => {
    set((state) => ({ filters: { ...state.filters, ...patch } }));
    get().load({ refresh: true });
  },

  resetFilters: () => {
    set({ filters: { ...initialFilters } });
    get().load({ refresh: true });
  },

  loadCategories: async () => {
    try {
      const res = await productApi.categories();
      set({ categories: res.categories });
    } catch {
      set({ categories: [] });
    }
  },

  load: async ({ refresh = false } = {}) => {
    const { loading, hasMore, page, filters } = get();
    if (loading || (!refresh && !hasMore)) return;

    const nextPage = refresh ? 1 : page;
    set(refresh ? { refreshing: true, error: null } : { loading: true, error: null });

    try {
      const res = await productApi.list({ ...filters, page: nextPage });
      set((state) => ({
        products: refresh ? res.items : [...state.products, ...res.items],
        page: nextPage + 1,
        hasMore: res.hasMore,
        loading: false,
        refreshing: false,
      }));
    } catch (err) {
      set({ loading: false, refreshing: false, error: err.message });
    }
  },

  decrementStock: (productId, qty) => set((state) => ({
    products: state.products.map((p) => (p._id === productId ? { ...p, stock: p.stock - qty } : p)),
  })),
}));
