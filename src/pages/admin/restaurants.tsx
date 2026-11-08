import { useEffect, useState } from "react";
import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import {
  Bike,
  ChevronDown,
  ChevronRight,
  Clock3,
  Pencil,
  Plus,
  Search,
  Star,
  Store,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/ui";
import { Modal } from "@/components/ui/modal";
import { Toggle, PillTabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/components/providers";
import { useCatalogStore, useCatalog } from "@/lib/store/catalog";

import type { MenuItem, Restaurant } from "@/lib/types";
import { cn, formatMMK } from "@/lib/utils";
import { colorFromString, slugify } from "@/lib/utils";

type Filter = "all" | "open" | "closed";

export default function AdminRestaurantsPage() {
  const mounted = useMounted();
  const catalog = useCatalog();
  const addRestaurant = useCatalogStore((s) => s.addRestaurant);
  const updateRestaurant = useCatalogStore((s) => s.updateRestaurant);
  const deleteRestaurant = useCatalogStore((s) => s.deleteRestaurant);
  const addMenuItem = useCatalogStore((s) => s.addMenuItem);
  const updateMenuItem = useCatalogStore((s) => s.updateMenuItem);
  const setRestaurantOpen = useCatalogStore((s) => s.setRestaurantOpen);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Restaurant>>({});
  const [priceItem, setPriceItem] = useState<MenuItem | null>(null);
  const [priceValue, setPriceValue] = useState("");

  // Create shop modal
  const [createShopOpen, setCreateShopOpen] = useState(false);
  const [shopDraft, setShopDraft] = useState({
    name: "",
    cuisine: "",
    township: "",
    address: "",
    description: "",
    cover: "/images/restaurant-1.jpg",
    deliveryFee: 1500,
    minOrder: 5000,
    etaMin: 20,
    etaMax: 30,
    distanceKm: 1.2,
    hours: "10:00 AM – 10:00 PM",
    tags: "",
    isOpen: true,
    isFeatured: false,
  });

  // Add menu item modal
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addMenuRestaurantId, setAddMenuRestaurantId] = useState<string>("");
  const [addMenuCategory, setAddMenuCategory] = useState<string>("__new__");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [menuItemDraft, setMenuItemDraft] = useState({
    name: "",
    description: "",
    price: 0,
    image: "/images/food-chicken-rice.jpg",
    isPopular: false,
    isAvailable: true,
  });

  const merged = catalog;

  const allItems = merged.flatMap((r) =>
    r.categories.flatMap((c) => c.items),
  );
  const soldOut = allItems.filter((item) => !item.isAvailable).length;

  const filtered = merged.filter((restaurant) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      restaurant.name.toLowerCase().includes(q) ||
      restaurant.cuisine.toLowerCase().includes(q) ||
      restaurant.township.toLowerCase().includes(q);
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "open"
          ? restaurant.isOpen
          : !restaurant.isOpen;
    return matchesQuery && matchesFilter;
  });

  const openEdit = (restaurant: Restaurant) => {
    setEditing(restaurant);
    setEditDraft({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      description: restaurant.description,
      cover: restaurant.cover,
      deliveryFee: restaurant.deliveryFee,
      minOrder: restaurant.minOrder,
      etaMin: restaurant.etaMin,
      etaMax: restaurant.etaMax,
      distanceKm: restaurant.distanceKm,
      address: restaurant.address,
      hours: restaurant.hours,
      isOpen: restaurant.isOpen,
      isFeatured: restaurant.isFeatured,
      township: restaurant.township,
      tags: restaurant.tags,
    });
  };

  const saveRestaurant = async () => {
    if (!editing) return;
    const patch: Partial<Restaurant> = {
      name: (editDraft.name as string)?.trim() || editing.name,
      cuisine: (editDraft.cuisine as string) ?? editing.cuisine,
      description: (editDraft.description as string) ?? editing.description,
      cover: (editDraft.cover as string) ?? editing.cover,
      deliveryFee: Math.max(0, Number(editDraft.deliveryFee) || 0),
      minOrder: Math.max(0, Number(editDraft.minOrder) || 0),
      etaMin: Math.max(1, Number(editDraft.etaMin) || 1),
      etaMax: Math.max(
        Number(editDraft.etaMin) || 1,
        Number(editDraft.etaMax) || 1,
      ),
      distanceKm: Number(editDraft.distanceKm) || editing.distanceKm,
      address: (editDraft.address as string) ?? editing.address,
      hours: (editDraft.hours as string) ?? editing.hours,
      isOpen: Boolean(editDraft.isOpen),
      isFeatured: Boolean(editDraft.isFeatured),
      township: (editDraft.township as string) ?? editing.township,
      tags: (editDraft.tags as string[]) ?? editing.tags,
    };
    await updateRestaurant(editing.id, patch);
    toast.success(`${patch.name} updated`);
    setEditing(null);
  };

  const openPrice = (item: MenuItem) => {
    setPriceItem(item);
    setPriceValue(String(item.price));
  };

  const savePrice = async () => {
    if (!priceItem) return;
    const next = Math.max(0, Number(priceValue) || 0);
    if (next <= 0) {
      toast.error("Enter a valid price.");
      return;
    }
    await updateMenuItem(priceItem.id, { price: next });
    toast.success(`${priceItem.name} price updated`);
    setPriceItem(null);
  };

  const toggleAvailability = async (item: MenuItem, next: boolean) => {
    await updateMenuItem(item.id, { isAvailable: next });
    toast.success(`${item.name} ${next ? "available" : "sold out"}`);
  };

  const handleCreateShop = async () => {
    if (!shopDraft.name.trim() || !shopDraft.cuisine.trim() || !shopDraft.township.trim()) {
      toast.error("Name, cuisine and township are required.");
      return;
    }
    const baseSlug = slugify(shopDraft.name);
    const existingSlugs = new Set(catalog.map((r) => r.slug));
    let slug = baseSlug;
    let i = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${i++}`;
    }
    const newRestaurant: Restaurant = {
      id: `rest-${Date.now()}`,
      slug,
      name: shopDraft.name.trim(),
      cuisine: shopDraft.cuisine.trim(),
      description: shopDraft.description.trim(),
      cover: shopDraft.cover,
      logoColor: colorFromString(shopDraft.name),
      rating: 0,
      ratingCount: 0,
      deliveryFee: Math.max(0, Number(shopDraft.deliveryFee) || 0),
      minOrder: Math.max(0, Number(shopDraft.minOrder) || 0),
      etaMin: Math.max(1, Number(shopDraft.etaMin) || 1),
      etaMax: Math.max(
        Number(shopDraft.etaMin) || 1,
        Number(shopDraft.etaMax) || 1,
      ),
      distanceKm: Number(shopDraft.distanceKm) || 1.0,
      isOpen: shopDraft.isOpen,
      isFeatured: shopDraft.isFeatured,
      township: shopDraft.township.trim(),
      address: shopDraft.address.trim(),
      hours: shopDraft.hours.trim(),
      lat: 16.8505,
      lng: 96.1315,
      tags: shopDraft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      categories: [],
    };
    const ok = await addRestaurant(newRestaurant);
    if (ok) {
      toast.success(`${newRestaurant.name} added`);
      setCreateShopOpen(false);
      setShopDraft({
        name: "",
        cuisine: "",
        township: "",
        address: "",
        description: "",
        cover: "/images/restaurant-1.jpg",
        deliveryFee: 1500,
        minOrder: 5000,
        etaMin: 20,
        etaMax: 30,
        distanceKm: 1.2,
        hours: "10:00 AM – 10:00 PM",
        tags: "",
        isOpen: true,
        isFeatured: false,
      });
      // open add menu modal for the new shop
      setAddMenuRestaurantId(newRestaurant.id);
      setAddMenuOpen(true);
    } else {
      toast.error("Failed to add restaurant.");
    }
  };

  const handleAddMenuItem = async () => {
    if (!addMenuRestaurantId) {
      toast.error("Select a restaurant.");
      return;
    }
    if (!menuItemDraft.name.trim()) {
      toast.error("Item name is required.");
      return;
    }
    if (menuItemDraft.price <= 0) {
      toast.error("Enter a valid price.");
      return;
    }
    const rest = catalog.find((r) => r.id === addMenuRestaurantId);
    const categoryName =
      addMenuCategory === "__new__"
        ? newCategoryName.trim() || "Menu"
        : addMenuCategory;
    const categoryId =
      addMenuCategory === "__new__" ? null : addMenuCategory;

    // if new category name matches existing, use existing
    let finalCategoryId = categoryId;
    let finalCategoryName = categoryName;
    const existingCat = rest?.categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
    );
    if (existingCat) {
      finalCategoryId = existingCat.id;
      finalCategoryName = existingCat.name;
    }

    const item: MenuItem = {
      id: `item-${Date.now()}`,
      name: menuItemDraft.name.trim(),
      description: menuItemDraft.description.trim(),
      price: Number(menuItemDraft.price),
      image: menuItemDraft.image,
      isPopular: menuItemDraft.isPopular,
      isAvailable: menuItemDraft.isAvailable,
    };

    const ok = await addMenuItem(
      addMenuRestaurantId,
      finalCategoryId,
      finalCategoryName,
      item,
    );
    if (ok) {
      toast.success(`${item.name} added`);
      setAddMenuOpen(false);
      setMenuItemDraft({
        name: "",
        description: "",
        price: 0,
        image: "/images/food-chicken-rice.jpg",
        isPopular: false,
        isAvailable: true,
      });
      setNewCategoryName("");
      setAddMenuCategory("__new__");
    } else {
      toast.error("Failed to add menu item.");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const create = params.get("create");
    if (create === "restaurant") setCreateShopOpen(true);
    if (create === "menu") setAddMenuOpen(true);
    if (create) window.history.replaceState({}, "", window.location.pathname);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton h-24 rounded-3xl" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-3xl" />
      </div>
    );
  }

  const coverImages = Array.from({ length: 8 }, (_, i) => `/images/restaurant-${i + 1}.jpg`);
  const foodImages = [
    "food-bbq.jpg","food-biryani.jpg","food-bubble-tea.jpg","food-burger.jpg","food-cake.jpg",
    "food-chicken-rice.jpg","food-coffee.jpg","food-curry.jpg","food-drinks.jpg","food-dumplings.jpg",
    "food-fish.jpg","food-fried-chicken.jpg","food-fries.jpg","food-noodles.jpg","food-pasta.jpg",
    "food-pizza.jpg","food-ramen.jpg","food-rice.jpg","food-salad.jpg","food-smoothie.jpg",
    "food-soup.jpg","food-steak.jpg","food-tea.jpg",
  ].map((f) => `/images/${f}`);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {[
          { label: "Restaurants", value: String(merged.length), icon: <Store size={16} />, tone: "bg-brand-soft text-brand-dark" },
          { label: "Open now", value: String(merged.filter((item) => item.isOpen).length), icon: <Clock3 size={16} />, tone: "bg-emerald-50 text-emerald-600" },
          { label: "Menu items", value: String(allItems.length), icon: <UtensilsCrossed size={16} />, tone: "bg-blue-50 text-blue-600" },
          { label: "Sold out", value: String(soldOut), icon: <X size={16} />, tone: "bg-rose-50 text-rose-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-white p-3.5 shadow-card">
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", stat.tone)}>{stat.icon}</span>
            <p className="mt-2 text-xl font-extrabold tracking-tight">{stat.value}</p>
            <p className="text-[9px] font-semibold text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <AdminCard
        title="Partner restaurants"
        subtitle="Toggle availability, edit details and manage menu items"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddMenuOpen(true)}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-line bg-white px-3 text-[10px] font-bold text-ink transition hover:border-brand/30"
            >
              <Plus size={12} /> Add menu
            </button>
            <button
              type="button"
              onClick={() => setCreateShopOpen(true)}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-brand px-3 text-[10px] font-bold text-white transition hover:bg-brand-dark"
            >
              <Plus size={12} /> New shop
            </button>
            <Link
              to="/restaurants"
              className="inline-flex h-8 items-center gap-1 rounded-full border border-line bg-white px-3 text-[10px] font-bold text-ink transition hover:border-brand/30"
            >
              Customer view <ChevronRight size={12} />
            </Link>
          </div>
        }
        bodyClassName="p-0 sm:p-0"
      >
        <div className="space-y-3 border-b border-line/70 px-4 py-3 sm:px-5">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-cream/60 px-3">
            <Search size={15} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search restaurants, cuisines or townships..."
              className="h-full w-full bg-transparent text-[11px] outline-none placeholder:text-muted/60"
            />
          </div>
          <PillTabs
            size="sm"
            tabs={[
              { value: "all", label: "All", count: merged.length },
              { value: "open", label: "Open", count: merged.filter((item) => item.isOpen).length },
              { value: "closed", label: "Closed", count: merged.filter((item) => !item.isOpen).length },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div className="divide-y divide-line/70">
          {filtered.map((restaurant) => {
            const isExpanded = expanded === restaurant.id;
            const itemCount = restaurant.categories.reduce((sum, c) => sum + c.items.length, 0);
            return (
              <div key={restaurant.id}>
                <div className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-cream/30 sm:flex-row sm:items-center sm:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl">
                      <Image src={restaurant.cover} alt={restaurant.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-xs font-extrabold">{restaurant.name}</p>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide", restaurant.isOpen ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                          {restaurant.isOpen ? "Open" : "Closed"}
                        </span>
                        {restaurant.isFeatured && (
                          <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-brand">Featured</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[9px] text-muted">{restaurant.cuisine} · {restaurant.township}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[9px] text-muted">
                        <span className="inline-flex items-center gap-0.5"><Star size={9} className="fill-warning text-warning" /> {restaurant.rating}</span>
                        <span className="inline-flex items-center gap-0.5"><Bike size={9} /> {formatMMK(restaurant.deliveryFee)}</span>
                        <span className="inline-flex items-center gap-0.5"><Clock3 size={9} /> {restaurant.etaMin}–{restaurant.etaMax} min</span>
                        <span>{itemCount} items</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Toggle
                      checked={restaurant.isOpen}
                      onChange={(next) => {
                        setRestaurantOpen(restaurant.id, next);
                        toast.success(`${restaurant.name} is now ${next ? "open" : "closed"}`);
                      }}
                      label={`Toggle ${restaurant.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => openEdit(restaurant)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-muted transition hover:border-brand/30 hover:text-brand"
                      aria-label={`Edit ${restaurant.name}`}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : restaurant.id)}
                      className="flex h-8 items-center gap-1 rounded-full border border-line bg-white px-2.5 text-[9px] font-bold text-muted transition hover:border-brand/30 hover:text-brand"
                    >
                      Menu
                      <ChevronDown size={12} className={cn("transition-transform", isExpanded && "rotate-180")} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-3 bg-cream/50 px-4 py-3.5 sm:px-5">
                    {restaurant.categories.map((category) => (
                      <div key={category.id}>
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">{category.name}</p>
                        <div className="mt-1.5 grid gap-1.5 lg:grid-cols-2">
                          {category.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-2.5 py-2">
                              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                                <Image src={item.image} alt={item.name} fill sizes="32px" className="object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[10px] font-bold">{item.name}</p>
                                <p className="text-[9px] text-muted">{formatMMK(item.price)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => openPrice(item)}
                                className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-brand"
                                aria-label={`Edit price for ${item.name}`}
                              >
                                <Pencil size={10} />
                              </button>
                              <Toggle
                                checked={item.isAvailable !== false}
                                onChange={(next) => toggleAvailability(item, next)}
                                label={`Toggle ${item.name}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {restaurant.categories.length === 0 && (
                      <p className="text-[10px] text-muted">No menu items yet. Use “Add menu”.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <Search size={22} className="mx-auto text-muted/50" />
              <p className="mt-2 text-xs font-bold">No restaurants match</p>
              <p className="mt-1 text-[10px] text-muted">Try a different search or availability filter.</p>
            </div>
          )}
        </div>
      </AdminCard>

      {/* Edit restaurant modal */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : "Edit restaurant"}
        description="Changes appear in the customer app immediately."
        className="sm:max-w-xl"
        footer={
          <div className="flex gap-2">
            {editing && catalog.some((r) => r.id === editing.id && !r.id.startsWith("r")) && (
              <Button
                variant="outline"
                className="flex-1 text-rose-600"
                onClick={async () => {
                  if (!editing) return;
                  if (!confirm(`Delete ${editing.name}?`)) return;
                  await deleteRestaurant(editing.id);
                  toast.success(`${editing.name} deleted`);
                  setEditing(null);
                }}
              >
                <Trash2 size={14} /> Delete
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="flex-1" onClick={saveRestaurant}>Save changes</Button>
          </div>
        }
      >
        <div className="space-y-3 px-5 py-4 sm:px-6">
          <label className="block text-[10px] font-bold text-ink">
            Restaurant name
            <input value={(editDraft.name as string) ?? ""} onChange={(e) => setEditDraft((c) => ({ ...c, name: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Cuisine
            <input value={(editDraft.cuisine as string) ?? ""} onChange={(e) => setEditDraft((c) => ({ ...c, cuisine: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Township
            <input value={(editDraft.township as string) ?? ""} onChange={(e) => setEditDraft((c) => ({ ...c, township: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Description
            <textarea value={(editDraft.description as string) ?? ""} onChange={(e) => setEditDraft((c) => ({ ...c, description: e.target.value }))} rows={2} className="mt-1 w-full resize-none rounded-xl border border-line bg-cream/60 px-3 py-2 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Cover image
            <select value={(editDraft.cover as string) ?? ""} onChange={(e) => setEditDraft((c) => ({ ...c, cover: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white">
              {coverImages.map((src) => <option key={src} value={src}>{src}</option>)}
            </select>
          </label>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <label className="text-[10px] font-bold text-ink">
              Delivery fee
              <input type="number" min={0} value={(editDraft.deliveryFee as number) ?? 0} onChange={(e) => setEditDraft((c) => ({ ...c, deliveryFee: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
            </label>
            <label className="text-[10px] font-bold text-ink">
              Min order
              <input type="number" min={0} value={(editDraft.minOrder as number) ?? 0} onChange={(e) => setEditDraft((c) => ({ ...c, minOrder: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
            </label>
            <label className="text-[10px] font-bold text-ink">
              Distance (km)
              <input type="number" min={0} step={0.1} value={(editDraft.distanceKm as number) ?? 0} onChange={(e) => setEditDraft((c) => ({ ...c, distanceKm: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
            </label>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="text-[10px] font-bold text-ink">
              ETA min (min)
              <input type="number" min={1} value={(editDraft.etaMin as number) ?? 1} onChange={(e) => setEditDraft((c) => ({ ...c, etaMin: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
            </label>
            <label className="text-[10px] font-bold text-ink">
              ETA max (min)
              <input type="number" min={1} value={(editDraft.etaMax as number) ?? 1} onChange={(e) => setEditDraft((c) => ({ ...c, etaMax: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
            </label>
          </div>
          <label className="block text-[10px] font-bold text-ink">
            Address
            <input value={(editDraft.address as string) ?? ""} onChange={(e) => setEditDraft((c) => ({ ...c, address: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Opening hours
            <input value={(editDraft.hours as string) ?? ""} onChange={(e) => setEditDraft((c) => ({ ...c, hours: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <div className="flex items-center justify-between rounded-2xl bg-cream px-3 py-2.5">
            <div>
              <p className="text-[11px] font-bold">Accepting orders</p>
              <p className="text-[9px] text-muted">Closed restaurants show as unavailable to customers.</p>
            </div>
            <Toggle checked={Boolean(editDraft.isOpen)} onChange={(next) => setEditDraft((c) => ({ ...c, isOpen: next }))} label="Accepting orders" />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-cream px-3 py-2.5">
            <div>
              <p className="text-[11px] font-bold">Featured</p>
              <p className="text-[9px] text-muted">Featured restaurants appear on the home screen.</p>
            </div>
            <Toggle checked={Boolean(editDraft.isFeatured)} onChange={(next) => setEditDraft((c) => ({ ...c, isFeatured: next }))} label="Featured" />
          </div>
        </div>
      </Modal>

      {/* Price modal */}
      <Modal
        open={Boolean(priceItem)}
        onClose={() => setPriceItem(null)}
        title={priceItem ? `Edit price · ${priceItem.name}` : "Edit price"}
        description="Update the menu price in MMK."
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setPriceItem(null)}>Cancel</Button>
            <Button className="flex-1" onClick={savePrice}>Save price</Button>
          </div>
        }
      >
        {priceItem && (
          <div className="space-y-3 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3 rounded-2xl bg-cream p-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl">
                <Image src={priceItem.image} alt={priceItem.name} fill sizes="48px" className="object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold">{priceItem.name}</p>
                <p className="text-[10px] text-muted">Current price {formatMMK(priceItem.price)}</p>
              </div>
            </div>
            <label className="block text-[10px] font-bold text-ink">
              New price (Ks)
              <input type="number" min={1} value={priceValue} onChange={(e) => setPriceValue(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-cream/60 px-3 text-sm font-semibold outline-none focus:border-brand/40 focus:bg-white" />
            </label>
          </div>
        )}
      </Modal>

      {/* Create shop modal */}
      <Modal open={createShopOpen} onClose={() => setCreateShopOpen(false)} title="New restaurant" description="Add a new partner shop." className="sm:max-w-xl">
        <div className="space-y-3 px-5 py-4 sm:px-6">
          <label className="block text-[10px] font-bold text-ink">
            Restaurant name *
            <input value={shopDraft.name} onChange={(e) => setShopDraft((c) => ({ ...c, name: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Cuisine *
            <input value={shopDraft.cuisine} onChange={(e) => setShopDraft((c) => ({ ...c, cuisine: e.target.value }))} placeholder="e.g. Burmese · Rice & Curry" className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Township *
            <input value={shopDraft.township} onChange={(e) => setShopDraft((c) => ({ ...c, township: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Description
            <textarea value={shopDraft.description} onChange={(e) => setShopDraft((c) => ({ ...c, description: e.target.value }))} rows={2} className="mt-1 w-full resize-none rounded-xl border border-line bg-cream/60 px-3 py-2 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Cover image
            <select value={shopDraft.cover} onChange={(e) => setShopDraft((c) => ({ ...c, cover: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white">
              {coverImages.map((src) => <option key={src} value={src}>{src}</option>)}
            </select>
          </label>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <label className="text-[10px] font-bold text-ink">
              Delivery fee
              <input type="number" min={0} value={shopDraft.deliveryFee} onChange={(e) => setShopDraft((c) => ({ ...c, deliveryFee: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
            </label>
            <label className="text-[10px] font-bold text-ink">
              Min order
              <input type="number" min={0} value={shopDraft.minOrder} onChange={(e) => setShopDraft((c) => ({ ...c, minOrder: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
            </label>
            <label className="text-[10px] font-bold text-ink">
              Distance (km)
              <input type="number" min={0} step={0.1} value={shopDraft.distanceKm} onChange={(e) => setShopDraft((c) => ({ ...c, distanceKm: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
            </label>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="text-[10px] font-bold text-ink">
              ETA min
              <input type="number" min={1} value={shopDraft.etaMin} onChange={(e) => setShopDraft((c) => ({ ...c, etaMin: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
            </label>
            <label className="text-[10px] font-bold text-ink">
              ETA max
              <input type="number" min={1} value={shopDraft.etaMax} onChange={(e) => setShopDraft((c) => ({ ...c, etaMax: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
            </label>
          </div>
          <label className="block text-[10px] font-bold text-ink">
            Address
            <input value={shopDraft.address} onChange={(e) => setShopDraft((c) => ({ ...c, address: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Opening hours
            <input value={shopDraft.hours} onChange={(e) => setShopDraft((c) => ({ ...c, hours: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Tags (comma separated)
            <input value={shopDraft.tags} onChange={(e) => setShopDraft((c) => ({ ...c, tags: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <div className="flex items-center justify-between rounded-2xl bg-cream px-3 py-2.5">
            <p className="text-[11px] font-bold">Accepting orders</p>
            <Toggle checked={shopDraft.isOpen} onChange={(next) => setShopDraft((c) => ({ ...c, isOpen: next }))} label="Accepting orders" />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-cream px-3 py-2.5">
            <p className="text-[11px] font-bold">Featured</p>
            <Toggle checked={shopDraft.isFeatured} onChange={(next) => setShopDraft((c) => ({ ...c, isFeatured: next }))} label="Featured" />
          </div>
        </div>
        <div className="border-t border-line bg-white px-5 py-3 sm:px-6">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setCreateShopOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreateShop}>Create shop</Button>
          </div>
        </div>
      </Modal>

      {/* Add menu item modal */}
      <Modal open={addMenuOpen} onClose={() => setAddMenuOpen(false)} title="Add menu item" description="Add a dish to a restaurant.">
        <div className="space-y-3 px-5 py-4 sm:px-6">
          <label className="block text-[10px] font-bold text-ink">
            Restaurant
            <select value={addMenuRestaurantId} onChange={(e) => setAddMenuRestaurantId(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white">
              <option value="">Select restaurant</option>
              {catalog.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Category
            <select value={addMenuCategory} onChange={(e) => setAddMenuCategory(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white">
              <option value="__new__">+ New category</option>
              {catalog.find((r) => r.id === addMenuRestaurantId)?.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          {addMenuCategory === "__new__" && (
            <label className="block text-[10px] font-bold text-ink">
              New category name
              <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
            </label>
          )}
          <label className="block text-[10px] font-bold text-ink">
            Item name *
            <input value={menuItemDraft.name} onChange={(e) => setMenuItemDraft((c) => ({ ...c, name: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Description
            <textarea value={menuItemDraft.description} onChange={(e) => setMenuItemDraft((c) => ({ ...c, description: e.target.value }))} rows={2} className="mt-1 w-full resize-none rounded-xl border border-line bg-cream/60 px-3 py-2 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Price (Ks) *
            <input type="number" min={1} value={menuItemDraft.price} onChange={(e) => setMenuItemDraft((c) => ({ ...c, price: Number(e.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white" />
          </label>
          <label className="block text-[10px] font-bold text-ink">
            Image
            <select value={menuItemDraft.image} onChange={(e) => setMenuItemDraft((c) => ({ ...c, image: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white">
              {foodImages.map((src) => <option key={src} value={src}>{src}</option>)}
            </select>
          </label>
          <div className="flex items-center justify-between rounded-2xl bg-cream px-3 py-2.5">
            <p className="text-[11px] font-bold">Popular</p>
            <Toggle checked={menuItemDraft.isPopular} onChange={(next) => setMenuItemDraft((c) => ({ ...c, isPopular: next }))} label="Popular" />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-cream px-3 py-2.5">
            <p className="text-[11px] font-bold">Available</p>
            <Toggle checked={menuItemDraft.isAvailable} onChange={(next) => setMenuItemDraft((c) => ({ ...c, isAvailable: next }))} label="Available" />
          </div>
        </div>
        <div className="border-t border-line bg-white px-5 py-3 sm:px-6">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setAddMenuOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAddMenuItem}>Add item</Button>
          </div>
        </div>
      </Modal>

      <p className="text-center text-[9px] text-muted/60">
        {merged.length} restaurants · {allItems.length} menu items · stored in Supabase
      </p>
    </div>
  );
}