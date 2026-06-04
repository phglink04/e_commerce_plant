import { create } from "zustand";
import api from "@/lib/api";

type HomeUiState = {
  cartCount: number;
  wishlistIds: string[];
  recentSearches: string[];
  logo: string;
  setCartCount: (value: number) => void;
  incrementCart: (step?: number) => void;
  decrementCart: (step?: number) => void;
  syncCartCount: (token: string | null) => Promise<void>;
  toggleWishlist: (id: string) => void;
  pushRecentSearch: (keyword: string) => void;
  setLogo: (url: string) => void;
  fetchLogo: () => Promise<void>;
};

export const useHomeUiStore = create<HomeUiState>((set) => ({
  cartCount: 0,
  wishlistIds: [],
  recentSearches: [],
  logo: "/frontend/logo/logo.png",

  setCartCount: (value) => set({ cartCount: Math.max(0, value) }),

  incrementCart: (step = 1) =>
    set((state) => ({ cartCount: Math.max(0, state.cartCount + step) })),

  decrementCart: (step = 1) =>
    set((state) => ({ cartCount: Math.max(0, state.cartCount - step) })),

  syncCartCount: async (token: string | null) => {
    if (!token) { set({ cartCount: 0 }); return; }
    try {
      const res = await api.get("/api/users/cart", { headers: { Authorization: `Bearer ${token}` } });
      const cart = res.data?.data?.cart ?? [];
      set({ cartCount: cart.length });
    } catch { /* silent */ }
  },

  toggleWishlist: (id) =>
    set((state) => ({
      wishlistIds: state.wishlistIds.includes(id)
        ? state.wishlistIds.filter((item) => item !== id)
        : [...state.wishlistIds, id],
    })),

  pushRecentSearch: (keyword) => {
    const value = keyword.trim();

    if (!value) {
      return;
    }

    set((state) => {
      const next = [
        value,
        ...state.recentSearches.filter((item) => item !== value),
      ];
      return { recentSearches: next.slice(0, 6) };
    });
  },

  setLogo: (url) => set({ logo: url }),

  fetchLogo: async () => {
    try {
      const res = await api.get("/api/home-settings");
      const url = res.data?.data?.settings?.logo;
      if (url) {
        set({ logo: url });
      }
    } catch { /* silent */ }
  },
}));
