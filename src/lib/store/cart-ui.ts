import { create } from "zustand";
import type { MenuItem, Restaurant } from "@/lib/types";
import { useCartStore } from "@/lib/store/cart";

export type CartEntry = {
  item: MenuItem;
  qty: number;
};

type AfterConfirm = "drawer" | "cart";

type PendingReplacement = {
  restaurant: Restaurant;
  entries: CartEntry[];
  afterConfirm: AfterConfirm;
};

type AddResult = "added" | "pending";

type CartUiState = {
  drawerOpen: boolean;
  pendingReplacement: PendingReplacement | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  requestAdd: (restaurant: Restaurant, item: MenuItem, qty?: number) => AddResult;
  requestAddMany: (restaurant: Restaurant, entries: CartEntry[]) => AddResult;
  confirmReplacement: () => AfterConfirm | null;
  cancelReplacement: () => void;
};

/**
 * UI state for the floating cart dock and mini cart drawer.
 * Adding a dish from a different restaurant is held here until the
 * customer explicitly confirms replacing the current cart.
 */
export const useCartUiStore = create<CartUiState>((set, get) => ({
  drawerOpen: false,
  pendingReplacement: null,

  openDrawer: () => {
    if (useCartStore.getState().lines.length > 0) {
      set({ drawerOpen: true });
    }
  },

  closeDrawer: () => set({ drawerOpen: false }),

  requestAdd: (restaurant, item, qty = 1) => {
    const cart = useCartStore.getState();
    const hasItems = cart.lines.length > 0;

    if (
      hasItems &&
      cart.restaurant &&
      cart.restaurant.id !== restaurant.id
    ) {
      set({
        pendingReplacement: {
          restaurant,
          entries: [{ item, qty }],
          afterConfirm: "drawer",
        },
      });
      return "pending";
    }

    const wasEmpty = cart.lines.length === 0;
    cart.addItem(restaurant, item, qty);

    if (wasEmpty) {
      set({ drawerOpen: true });
    }

    return "added";
  },

  requestAddMany: (restaurant, entries) => {
    if (entries.length === 0) return "added";

    const cart = useCartStore.getState();

    if (
      cart.lines.length > 0 &&
      cart.restaurant &&
      cart.restaurant.id !== restaurant.id
    ) {
      set({
        pendingReplacement: {
          restaurant,
          entries,
          afterConfirm: "cart",
        },
      });
      return "pending";
    }

    cart.addItems(restaurant, entries);
    return "added";
  },

  confirmReplacement: () => {
    const pending = get().pendingReplacement;
    if (!pending) return null;

    useCartStore
      .getState()
      .replaceWith(pending.restaurant, pending.entries);

    set({
      pendingReplacement: null,
      drawerOpen: pending.afterConfirm === "drawer",
    });

    return pending.afterConfirm;
  },

  cancelReplacement: () => set({ pendingReplacement: null }),
}));
