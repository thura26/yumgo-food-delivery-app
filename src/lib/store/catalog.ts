import { create } from "zustand";
import type { Restaurant, MenuItem } from "@/lib/types";
import {
  fetchCatalog,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  addMenuCategory,
  addMenuItem as addMenuItemRemote,
  updateMenuItem as updateMenuItemRemote,
  deleteMenuItem as deleteMenuItemRemote,
} from "@/lib/db/catalog";

type CatalogState = {
  restaurants: Restaurant[];
  loaded: boolean;
  loading: boolean;
  hydrate: () => Promise<void>;
  addRestaurant: (restaurant: Restaurant) => Promise<boolean>;
  updateRestaurant: (id: string, patch: Partial<Restaurant>) => Promise<boolean>;
  deleteRestaurant: (id: string) => Promise<boolean>;
  addMenuItem: (
    restaurantId: string,
    categoryId: string | null,
    categoryName: string,
    item: MenuItem,
  ) => Promise<boolean>;
  updateMenuItem: (
    itemId: string,
    patch: { price?: number; isAvailable?: boolean; name?: string; description?: string; image?: string },
  ) => Promise<boolean>;
  deleteMenuItem: (itemId: string, categoryId?: string) => Promise<boolean>;
  setRestaurantOpen: (id: string, isOpen: boolean) => Promise<boolean>;
};

let hydratePromise: Promise<void> | null = null;

export const useCatalogStore = create<CatalogState>()((set, get) => ({
  restaurants: [],
  loaded: false,
  loading: false,

  hydrate: async () => {
    if (get().loaded) return;
    if (hydratePromise) return hydratePromise;
    hydratePromise = (async () => {
      set({ loading: true });
      try {
        const data = await fetchCatalog();
        set({ restaurants: data, loaded: true, loading: false });
      } finally {
        hydratePromise = null;
      }
    })();
    return hydratePromise;
  },

  addRestaurant: async (restaurant) => {
    const ok = await createRestaurant(restaurant);
    if (ok) {
      set({ restaurants: [...get().restaurants, restaurant] });
    }
    return ok;
  },

  updateRestaurant: async (id, patch) => {
    const ok = await updateRestaurant(id, patch);
    if (ok) {
      set({
        restaurants: get().restaurants.map((r) =>
          r.id === id ? { ...r, ...patch } : r,
        ),
      });
    }
    return ok;
  },

  deleteRestaurant: async (id) => {
    const ok = await deleteRestaurant(id);
    if (ok) {
      set({ restaurants: get().restaurants.filter((r) => r.id !== id) });
    }
    return ok;
  },

  addMenuItem: async (restaurantId, categoryId, categoryName, item) => {
    // find or create category
    const rest = get().restaurants.find((r) => r.id === restaurantId);
    let catId = categoryId;
    let existingCat = catId
      ? rest?.categories.find((c) => c.id === catId)
      : undefined;

    if (!existingCat) {
      // try match by name
      existingCat = rest?.categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
      );
      if (existingCat) catId = existingCat.id;
    }

    if (!existingCat) {
      catId = `cat-${Date.now()}`;
      const ok = await addMenuCategory(restaurantId, catId, categoryName);
      if (!ok) return false;
    }

    const ok = await addMenuItemRemote(catId!, item);
    if (!ok) return false;

    set({
      restaurants: get().restaurants.map((r) => {
        if (r.id !== restaurantId) return r;
        const cats = [...r.categories];
        const idx = cats.findIndex((c) => c.id === catId);
        if (idx >= 0) {
          cats[idx] = { ...cats[idx], items: [...cats[idx].items, item] };
        } else {
          cats.push({ id: catId!, name: categoryName, items: [item] });
        }
        return { ...r, categories: cats };
      }),
    });
    return true;
  },

  updateMenuItem: async (itemId, patch) => {
    const ok = await updateMenuItemRemote(itemId, patch);
    if (ok) {
      set({
        restaurants: get().restaurants.map((r) => ({
          ...r,
          categories: r.categories.map((c) => ({
            ...c,
            items: c.items.map((it) =>
              it.id === itemId
                ? {
                    ...it,
                    price: patch.price ?? it.price,
                    isAvailable:
                      patch.isAvailable !== undefined
                        ? patch.isAvailable
                        : it.isAvailable,
                    name: patch.name ?? it.name,
                    description: patch.description ?? it.description,
                    image: patch.image ?? it.image,
                  }
                : it,
            ),
          })),
        })),
      });
    }
    return ok;
  },

  deleteMenuItem: async (itemId, categoryId) => {
    const ok = await deleteMenuItemRemote(itemId);
    if (ok) {
      set({
        restaurants: get().restaurants.map((r) => ({
          ...r,
          categories: r.categories
            .map((c) => ({
              ...c,
              items: c.items.filter((it) => it.id !== itemId),
            }))
            .filter((c) => c.items.length > 0 || c.id !== categoryId),
        })),
      });
    }
    return ok;
  },

  setRestaurantOpen: async (id, isOpen) => {
    const ok = await updateRestaurant(id, { isOpen });
    if (ok) {
      set({
        restaurants: get().restaurants.map((r) =>
          r.id === id ? { ...r, isOpen } : r,
        ),
      });
    }
    return ok;
  },
}));

// Auto-hydrate on first use in client components.
export function useCatalog(): Restaurant[] {
  const restaurants = useCatalogStore((s) => s.restaurants);
  const loaded = useCatalogStore((s) => s.loaded);
  const hydrate = useCatalogStore((s) => s.hydrate);
  if (typeof window !== "undefined" && !loaded) {
    void hydrate();
  }
  return restaurants;
}

export function useCatalogRestaurant(restaurant: Restaurant): Restaurant {
  const catalog = useCatalog();
  return catalog.find((item) => item.id === restaurant.id) ?? restaurant;
}

export function useCatalogBySlug(slug: string): Restaurant | undefined {
  const catalog = useCatalog();
  return catalog.find((item) => item.slug === slug);
}

// expose slugify helper re-export
export { slugify } from "@/lib/utils";