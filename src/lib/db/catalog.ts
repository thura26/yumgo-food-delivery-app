import { getSupabaseClient } from "@/lib/supabase";
import type { MenuItem, MenuCategory, Restaurant } from "@/lib/types";

type RestaurantRow = {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  description: string;
  cover: string;
  logo_color: string;
  rating: number;
  rating_count: number;
  delivery_fee: number;
  min_order: number;
  eta_min: number;
  eta_max: number;
  distance_km: number;
  is_open: boolean;
  is_featured: boolean;
  township: string;
  address: string;
  hours: string;
  lat: number;
  lng: number;
  tags: string[] | null;
  sort_order: number;
};

type CategoryRow = {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
};

type ItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  is_popular: boolean;
  is_available: boolean;
  sort_order: number;
};

function rowToRestaurant(
  row: RestaurantRow,
  categories: MenuCategory[],
): Restaurant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    cuisine: row.cuisine,
    description: row.description,
    cover: row.cover,
    logoColor: row.logo_color,
    rating: Number(row.rating),
    ratingCount: row.rating_count,
    deliveryFee: row.delivery_fee,
    minOrder: row.min_order,
    etaMin: row.eta_min,
    etaMax: row.eta_max,
    distanceKm: Number(row.distance_km),
    isOpen: row.is_open,
    isFeatured: row.is_featured,
    township: row.township,
    address: row.address,
    hours: row.hours,
    lat: row.lat,
    lng: row.lng,
    tags: row.tags ?? [],
    categories,
  };
}

export async function fetchCatalog(): Promise<Restaurant[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !restaurants) return [];

  const ids = (restaurants as RestaurantRow[]).map((r) => r.id);
  const { data: categories } = await supabase
    .from("menu_categories")
    .select("*")
    .in("restaurant_id", ids)
    .order("sort_order", { ascending: true });
  const catRows = (categories ?? []) as CategoryRow[];
  const catIds = catRows.map((c) => c.id);
  const { data: items } = await supabase
    .from("menu_items")
    .select("*")
    .in("category_id", catIds.length ? catIds : ["__none__"])
    .order("sort_order", { ascending: true });
  const itemRows = (items ?? []) as ItemRow[];

  const itemsByCat = new Map<string, MenuItem[]>();
  for (const it of itemRows) {
    const list = itemsByCat.get(it.category_id) ?? [];
    list.push({
      id: it.id,
      name: it.name,
      description: it.description,
      price: it.price,
      image: it.image,
      isPopular: it.is_popular,
      isAvailable: it.is_available,
    });
    itemsByCat.set(it.category_id, list);
  }

  const catsByRest = new Map<string, MenuCategory[]>();
  for (const c of catRows) {
    const list = catsByRest.get(c.restaurant_id) ?? [];
    list.push({
      id: c.id,
      name: c.name,
      items: itemsByCat.get(c.id) ?? [],
    });
    catsByRest.set(c.restaurant_id, list);
  }

  return (restaurants as RestaurantRow[]).map((r) =>
    rowToRestaurant(r, catsByRest.get(r.id) ?? []),
  );
}

export async function createRestaurant(
  restaurant: Restaurant,
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.from("restaurants").insert({
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    description: restaurant.description,
    cover: restaurant.cover,
    logo_color: restaurant.logoColor,
    rating: restaurant.rating,
    rating_count: restaurant.ratingCount,
    delivery_fee: restaurant.deliveryFee,
    min_order: restaurant.minOrder,
    eta_min: restaurant.etaMin,
    eta_max: restaurant.etaMax,
    distance_km: restaurant.distanceKm,
    is_open: restaurant.isOpen,
    is_featured: restaurant.isFeatured,
    township: restaurant.township,
    address: restaurant.address,
    hours: restaurant.hours,
    lat: restaurant.lat,
    lng: restaurant.lng,
    tags: restaurant.tags,
    sort_order: 999,
  });
  if (error) {
    console.error("createRestaurant", error);
    return false;
  }

  // categories + items
  for (let ci = 0; ci < restaurant.categories.length; ci++) {
    const cat = restaurant.categories[ci];
    const { error: catErr } = await supabase.from("menu_categories").insert({
      id: cat.id,
      restaurant_id: restaurant.id,
      name: cat.name,
      sort_order: ci,
    });
    if (catErr) console.error("createCategory", catErr);
    for (let ii = 0; ii < cat.items.length; ii++) {
      const it = cat.items[ii];
      const { error: itemErr } = await supabase.from("menu_items").insert({
        id: it.id,
        category_id: cat.id,
        name: it.name,
        description: it.description,
        price: it.price,
        image: it.image,
        is_popular: Boolean(it.isPopular),
        is_available: it.isAvailable !== false,
        sort_order: ii,
      });
      if (itemErr) console.error("createItem", itemErr);
    }
  }
  return true;
}

export async function updateRestaurant(
  id: string,
  patch: Partial<Restaurant>,
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const row: Record<string, unknown> = {};
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.cuisine !== undefined) row.cuisine = patch.cuisine;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.cover !== undefined) row.cover = patch.cover;
  if (patch.logoColor !== undefined) row.logo_color = patch.logoColor;
  if (patch.rating !== undefined) row.rating = patch.rating;
  if (patch.ratingCount !== undefined) row.rating_count = patch.ratingCount;
  if (patch.deliveryFee !== undefined) row.delivery_fee = patch.deliveryFee;
  if (patch.minOrder !== undefined) row.min_order = patch.minOrder;
  if (patch.etaMin !== undefined) row.eta_min = patch.etaMin;
  if (patch.etaMax !== undefined) row.eta_max = patch.etaMax;
  if (patch.distanceKm !== undefined) row.distance_km = patch.distanceKm;
  if (patch.isOpen !== undefined) row.is_open = patch.isOpen;
  if (patch.isFeatured !== undefined) row.is_featured = patch.isFeatured;
  if (patch.township !== undefined) row.township = patch.township;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.hours !== undefined) row.hours = patch.hours;
  if (patch.lat !== undefined) row.lat = patch.lat;
  if (patch.lng !== undefined) row.lng = patch.lng;
  if (patch.tags !== undefined) row.tags = patch.tags;

  if (Object.keys(row).length === 0) return true;
  const { error } = await supabase.from("restaurants").update(row).eq("id", id);
  if (error) {
    console.error("updateRestaurant", error);
    return false;
  }
  return true;
}

export async function deleteRestaurant(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) {
    console.error("deleteRestaurant", error);
    return false;
  }
  return true;
}

export async function addMenuCategory(
  restaurantId: string,
  categoryId: string,
  name: string,
  sortOrder = 999,
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("menu_categories").insert({
    id: categoryId,
    restaurant_id: restaurantId,
    name,
    sort_order: sortOrder,
  });
  if (error) {
    console.error("addMenuCategory", error);
    return false;
  }
  return true;
}

export async function addMenuItem(
  categoryId: string,
  item: MenuItem,
  sortOrder = 999,
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("menu_items").insert({
    id: item.id,
    category_id: categoryId,
    name: item.name,
    description: item.description,
    price: item.price,
    image: item.image,
    is_popular: Boolean(item.isPopular),
    is_available: item.isAvailable !== false,
    sort_order: sortOrder,
  });
  if (error) {
    console.error("addMenuItem", error);
    return false;
  }
  return true;
}

export async function updateMenuItem(
  itemId: string,
  patch: { price?: number; isAvailable?: boolean; name?: string; description?: string; image?: string },
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const row: Record<string, unknown> = {};
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.isAvailable !== undefined) row.is_available = patch.isAvailable;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.image !== undefined) row.image = patch.image;
  if (Object.keys(row).length === 0) return true;
  const { error } = await supabase.from("menu_items").update(row).eq("id", itemId);
  if (error) {
    console.error("updateMenuItem", error);
    return false;
  }
  return true;
}

export async function deleteMenuItem(itemId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("menu_items").delete().eq("id", itemId);
  if (error) {
    console.error("deleteMenuItem", error);
    return false;
  }
  return true;
}

export async function deleteMenuCategory(categoryId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("menu_categories").delete().eq("id", categoryId);
  if (error) {
    console.error("deleteMenuCategory", error);
    return false;
  }
  return true;
}