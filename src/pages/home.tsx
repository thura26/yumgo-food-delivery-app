import { useMemo, useState } from "react";
import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CakeSlice,
  ChevronRight,
  CupSoda,
  Drumstick,
  LayoutGrid,
  MapPin,
  Sandwich,
  Soup,
  TicketPercent,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import { filterRestaurants, homeCategories } from "@/lib/catalog-utils";
import { useCatalog } from "@/lib/use-catalog";
import { getActiveAddress, useAddressStore } from "@/lib/store/addresses";
import { useAuthStore } from "@/lib/store/auth";
import { useAdminStore } from "@/lib/store/admin";
import { useMounted } from "@/components/providers";
import { Avatar } from "@/components/avatar";
import { SearchBar } from "@/components/search-bar";
import { RestaurantCard, RestaurantMiniCard } from "@/components/restaurant-card";
import { Rating } from "@/components/rating";
import { cn, formatMMK } from "@/lib/utils";

const categoryIcons: Record<string, LucideIcon> = {
  all: LayoutGrid,
  rice: UtensilsCrossed,
  noodles: Soup,
  chicken: Drumstick,
  burgers: Sandwich,
  drinks: CupSoda,
  desserts: CakeSlice,
};

export function HomeClient() {
  const navigate = useNavigate();
  const mounted = useMounted();
  const catalog = useCatalog();
  const user = useAuthStore((state) => state.user);
  const promotions = useAdminStore((state) => state.promotions);
  const addresses = useAddressStore((state) => state.addresses);
  const selectedId = useAddressStore((state) => state.selectedId);
  const addressOwnerId = useAddressStore((state) => state.ownerId);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const activeAddress = getActiveAddress(addresses, selectedId);
  const canShowAddress = mounted && (!user || addressOwnerId === user.id);
  const locationLabel =
    canShowAddress && activeAddress
      ? `${activeAddress.township}, ${activeAddress.city}`
      : "Set your location";

  const recommended = useMemo(() => {
    const list = filterRestaurants(catalog, "", category);
    return list.length ? list : catalog;
  }, [catalog, category]);

  const featured = useMemo(
    () => catalog.filter((restaurant) => restaurant.isFeatured),
    [catalog],
  );

  const popularItems = useMemo(
    () =>
      catalog
        .flatMap((restaurant) =>
          restaurant.categories.flatMap((category) =>
            category.items
              .filter((item) => item.isPopular && item.isAvailable !== false)
              .map((item) => ({ ...item, restaurant })),
          ),
        )
        .slice(0, 6),
    [catalog],
  );

  const activePromotion = useMemo(() => {
    const now = Date.now();
    return promotions.find(
      (promotion) =>
        promotion.isActive &&
        new Date(promotion.endsAt).getTime() > now &&
        promotion.usageCount < promotion.usageLimit,
    );
  }, [promotions]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "All") params.set("category", category);
    const search = params.toString();
    navigate(`/restaurants${search ? `?${search}` : ""}`);
  };

  return (
    <div className="px-4 pb-4 pt-4 sm:px-6 lg:px-8 lg:pt-7">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
          <MapPin size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            Deliver to
          </p>
          <Link
            to="/profile/addresses"
            className="flex items-center gap-1 text-left text-sm font-extrabold tracking-tight"
          >
            {locationLabel}
            <ChevronRight size={14} className="text-muted" />
          </Link>
        </div>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm"
          aria-label="Notifications"
          onClick={() => toast("You are all caught up ✨")}
        >
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-brand" />
        </button>
        <Link to="/profile" aria-label="Profile">
          {mounted && user ? (
            <Avatar name={user.name} color={user.avatarColor} size={40} />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
              YG
            </span>
          )}
        </Link>
      </header>

      <div className="mx-auto mt-4 w-full max-w-6xl">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={handleSearch}
          showFilter
          onFilter={() => navigate("/restaurants")}
        />
      </div>

      <section className="mx-auto mt-4 w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-[28px] bg-brand shadow-soft">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_50%,#7FE3AA_0%,transparent_55%)]" />
          <Image
            src="/images/hero-bowl.jpg"
            alt="Burmese chicken rice bowl"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1100px"
            className="object-cover object-[70%_50%] opacity-55 mix-blend-luminosity sm:object-[75%_50%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#006B33] via-[#00B14F]/90 to-transparent" />
          <div className="relative flex min-h-[214px] flex-col justify-center p-5 sm:min-h-[260px] sm:p-8 lg:p-10">
            <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
              <MapPin size={10} />
              {catalog.length > 0
                ? `${catalog.length} local kitchens · Live rider tracking`
                : "Cash on delivery · Live rider tracking"}
            </div>
            <h1 className="max-w-[270px] text-[28px] font-extrabold leading-[1.05] tracking-[-0.045em] text-white sm:max-w-md sm:text-[40px]">
              Local food,
              <br />
              closer to you.
            </h1>
            <p className="mt-2 max-w-[250px] text-[11px] leading-relaxed text-white/80 sm:max-w-sm sm:text-sm">
              Fresh from Yangon&apos;s best kitchens, delivered to your door in
              under 30 minutes.
            </p>
            <Link
              to="/restaurants"
              className="mt-4 inline-flex h-10 w-fit items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-brand shadow-sm transition hover:bg-cream sm:h-11 sm:px-5 sm:text-sm"
            >
              Order now
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="absolute bottom-5 right-5 hidden rounded-2xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur sm:block">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">
              Payment
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-ink">
              Cash on delivery
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-5 w-full max-w-6xl">
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {homeCategories.map((item) => {
            const Icon = categoryIcons[item.id] ?? LayoutGrid;
            const active = category === item.tag;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.tag)}
                className={cn(
                  "flex min-w-[72px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-3 py-2.5 transition-all",
                  active
                    ? "border-brand bg-brand text-white shadow-soft"
                    : "border-line bg-white text-muted hover:border-brand/30 hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    active ? "bg-white/15" : "bg-cream text-brand",
                  )}
                >
                  <Icon size={16} />
                </span>
                <span className="text-[10px] font-bold">{item.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
              Handpicked for you
            </p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight sm:text-2xl">
              {category === "All"
                ? "Recommended for you"
                : `${category} near you`}
            </h2>
          </div>
          <Link
            to={
              category === "All"
                ? "/restaurants"
                : `/restaurants?category=${encodeURIComponent(category)}`
            }
            className="inline-flex items-center gap-0.5 text-[11px] font-bold text-brand"
          >
            See all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {recommended.slice(0, 8).map((restaurant, index) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              priority={index < 2}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-7 w-full max-w-6xl">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
              Trending
            </p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight sm:text-2xl">
              Popular dishes
            </h2>
          </div>
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-0.5 text-[11px] font-bold text-brand"
          >
            See all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {popularItems.map(({ restaurant, ...item }) => (
            <Link
              key={item.id}
              to={`/restaurants/${restaurant.slug}`}
              className="w-[152px] shrink-0 rounded-3xl border border-line bg-white p-2 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft sm:w-[180px]"
            >
              <div className="relative aspect-[5/4] overflow-hidden rounded-2xl">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="180px"
                  className="object-cover"
                />
                <span className="absolute left-1.5 top-1.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[8px] font-bold text-brand shadow-sm">
                  {item.isPopular ? "Bestseller" : "New"}
                </span>
              </div>
              <p className="mt-2 line-clamp-1 px-0.5 text-xs font-bold">
                {item.name}
              </p>
              <div className="mt-1 flex items-center justify-between px-0.5 pb-0.5">
                <span className="text-[11px] font-extrabold text-brand">
                  {formatMMK(item.price)}
                </span>
                <Rating value={restaurant.rating} showCount={false} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {activePromotion && (
        <section className="mx-auto mt-7 w-full max-w-6xl">
          <div className="flex items-center gap-3 rounded-3xl border border-dashed border-brand/30 bg-brand-soft/50 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand shadow-sm">
              <TicketPercent size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">
                {activePromotion.description ||
                  (activePromotion.type === "percentage"
                    ? `${activePromotion.value}% off your order`
                    : `${formatMMK(activePromotion.value)} off your order`)}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                Use code{" "}
                <span className="font-bold text-brand">
                  {activePromotion.code}
                </span>{" "}
                at checkout. Min. order {formatMMK(activePromotion.minOrder)}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(activePromotion.code);
                toast.success(`Promo code ${activePromotion.code} copied`);
              }}
              className="shrink-0 rounded-full border border-brand/30 bg-white px-3 py-1.5 text-[10px] font-bold text-brand transition hover:bg-brand hover:text-white"
            >
              Copy
            </button>
          </div>
        </section>
      )}

      <section className="mx-auto mt-7 w-full max-w-6xl">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
              Quick picks
            </p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight sm:text-2xl">
              Open near you
            </h2>
          </div>
        </div>
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {featured.map((restaurant) => (
            <RestaurantMiniCard
              key={restaurant.id}
              restaurant={restaurant}
              className="shrink-0"
            />
          ))}
        </div>
      </section>

    </div>
  );
}
