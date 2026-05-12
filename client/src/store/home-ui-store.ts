import { create } from "zustand";

type HomeUiState = {
  cartCount: number;
  wishlistIds: string[];
  recentSearches: string[];
  setCartCount: (value: number) => void;
  incrementCart: (step?: number) => void;
  toggleWishlist: (id: string) => void;
  pushRecentSearch: (keyword: string) => void;
};

export const useHomeUiStore = create<HomeUiState>((set) => ({
  cartCount: 0,
  wishlistIds: [],
  recentSearches: [],

  setCartCount: (value) => set({ cartCount: Math.max(0, value) }),

  incrementCart: (step = 1) =>
    set((state) => ({ cartCount: Math.max(0, state.cartCount + step) })),

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
}));
