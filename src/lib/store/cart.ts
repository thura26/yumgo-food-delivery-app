import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, MenuItem, Restaurant } from "@/lib/types";

export type CartRestaurant = {
  id: string;
  slug: string;
  name: string;
  image: string;
  deliveryFee: number;
};

export type CartEntry = {
  item: MenuItem;
  qty: number;
};

function toCartRestaurant(restaurant: Restaurant): CartRestaurant {
  return {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    image: restaurant.cover,
    deliveryFee: restaurant.deliveryFee,
  };
}

function toCartLine(item: MenuItem, qty: number): CartLine {
  return {
    itemId: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    qty: Math.max(1, qty),
  };
}

type CartState = {
  restaurant: CartRestaurant | null;
  lines: CartLine[];
  notes: string;
  promoCode: string | null;
  addItem: (restaurant: Restaurant, item: MenuItem, qty?: number) => void;
  addItems: (restaurant: Restaurant, entries: CartEntry[]) => void;
  replaceWith: (restaurant: Restaurant, entries: CartEntry[]) => void;
  removeItem: (itemId: string) => void;
  setQty: (itemId: string, qty: number) => void;
  clear: () => void;
  setNotes: (notes: string) => void;
  setPromoCode: (code: string | null) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurant: null,
      lines: [],
      notes: "",
      promoCode: null,

      addItem: (restaurant, item, qty = 1) => {
        get().addItems(restaurant, [{ item, qty }]);
      },

      addItems: (restaurant, entries) => {
        if (entries.length === 0) return;

        const current = get();
        const sameRestaurant =
          current.restaurant?.id === restaurant.id && current.lines.length > 0;

        if (!sameRestaurant) {
          set({
            restaurant: toCartRestaurant(restaurant),
            lines: entries.map(({ item, qty }) => toCartLine(item, qty)),
            promoCode: null,
            notes: "",
          });
          return;
        }

        const merged = new Map(
          current.lines.map((line) => [line.itemId, { ...line }]),
        );

        for (const { item, qty } of entries) {
          const existing = merged.get(item.id);
          if (existing) {
            existing.qty += Math.max(1, qty);
          } else {
            merged.set(item.id, toCartLine(item, qty));
          }
        }

        set({ lines: Array.from(merged.values()) });
      },

      replaceWith: (restaurant, entries) => {
        if (entries.length === 0) {
          set({ restaurant: null, lines: [], promoCode: null, notes: "" });
          return;
        }

        set({
          restaurant: toCartRestaurant(restaurant),
          lines: entries.map(({ item, qty }) => toCartLine(item, qty)),
          promoCode: null,
          notes: "",
        });
      },

      removeItem: (itemId) => {
        const current = get();
        const lines = current.lines.filter((line) => line.itemId !== itemId);
        set({
          lines,
          restaurant: lines.length ? current.restaurant : null,
          promoCode: lines.length ? current.promoCode : null,
          notes: lines.length ? current.notes : "",
        });
      },

      setQty: (itemId, qty) => {
        if (qty <= 0) {
          get().removeItem(itemId);
          return;
        }
        const lines = get().lines.map((line) =>
          line.itemId === itemId ? { ...line, qty } : line,
        );
        set({ lines });
      },

      clear: () =>
        set({ restaurant: null, lines: [], notes: "", promoCode: null }),

      setNotes: (notes) => set({ notes }),

      setPromoCode: (promoCode) => set({ promoCode }),
    }),
    { name: "yumgo-cart-v1" },
  ),
);

export function getCartSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.price * line.qty, 0);
}

export function getCartCount(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}
