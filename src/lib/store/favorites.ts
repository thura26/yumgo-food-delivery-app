import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavoritesState = {
  ids: string[];
  toggle: (restaurantId: string) => boolean;
  isFavorite: (restaurantId: string) => boolean;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: ["r1", "r5", "r7"],

      toggle: (restaurantId) => {
        const exists = get().ids.includes(restaurantId);
        set({
          ids: exists
            ? get().ids.filter((id) => id !== restaurantId)
            : [...get().ids, restaurantId],
        });
        return !exists;
      },

      isFavorite: (restaurantId) => get().ids.includes(restaurantId),
    }),
    { name: "yumgo-favorites-v1" },
  ),
);
