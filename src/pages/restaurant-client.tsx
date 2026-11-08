import { useEffect, useMemo, useState } from "react";
import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bike,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  MessageSquareText,
  Share2,
  Star,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import type { Restaurant } from "@/lib/types";
import { cn, colorFromString, formatDate, formatMMK } from "@/lib/utils";
import { useFavoritesStore } from "@/lib/store/favorites";
import { useAdminStore } from "@/lib/store/admin";
import { useAuthStore } from "@/lib/store/auth";
import { useCatalog } from "@/lib/use-catalog";
import { useMounted } from "@/components/providers";
import { Avatar } from "@/components/avatar";
import { MenuItemRow } from "@/components/menu-item-row";
import { ReviewDialog } from "@/components/review-dialog";
import { PillTabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type Tab = "menu" | "reviews" | "about";

export function RestaurantClient({
  restaurant: initialRestaurant,
  slug,
}: {
  restaurant: Restaurant | null;
  slug: string;
}) {
  const navigate = useNavigate();
  const mounted = useMounted();
  const catalog = useCatalog();
  const resolved = mounted
    ? catalog.find((item) => item.slug === slug) ?? null
    : initialRestaurant;
  const adminReviews = useAdminStore((state) => state.reviews);
  const user = useAuthStore((state) => state.user);
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const [tab, setTab] = useState<Tab>("menu");
  const [activeCategory, setActiveCategory] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);

  const reviews = useMemo(() => {
    if (!mounted || !resolved) return [];

    const restaurantReviews = adminReviews.filter(
      (review) => review.restaurantId === resolved.id,
    );
    const published = restaurantReviews.filter((review) => review.isApproved);
    // Keep a customer's own pending review visible while moderation is open.
    const ownPending = restaurantReviews.filter(
      (review) =>
        !review.isApproved &&
        Boolean(user) &&
        (review.userId === user?.id ||
          (!review.userId && review.userName === user?.name)),
    );

    return [...published, ...ownPending];
  }, [mounted, resolved, adminReviews, user]);

  const restaurant = resolved;

  useEffect(() => {
    if (restaurant && !restaurant.categories.some((c) => c.id === activeCategory)) {
      setActiveCategory(restaurant.categories[0]?.id ?? "");
    }
  }, [restaurant, activeCategory]);

  const isFavorite = mounted && restaurant ? favoriteIds.includes(restaurant.id) : false;
  const category = restaurant?.categories.find(
    (item) => item.id === activeCategory,
  );
  const visibleReviews = reviews.slice(0, 6);
  const ratingBreakdown = useMemo(() => {
    return [5, 4, 3, 2, 1].map((score) => {
      const countForScore = reviews.filter((review) => review.rating === score).length;
      return {
        score,
        count: countForScore,
        percent: reviews.length ? (countForScore / reviews.length) * 100 : 0,
      };
    });
  }, [reviews]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Restaurant link copied");
    } catch {
      toast("Copy the URL from your browser to share.");
    }
  };

  const openReview = () => {
    if (!user) {
      toast("Sign in to write a review.");
      navigate(`/login?next=${encodeURIComponent(`/restaurants/${slug}`)}`);
      return;
    }
    setReviewOpen(true);
  };

  if (!mounted) {
    return (
      <div className="px-4 py-6">
        <div className="skeleton h-10 w-44 rounded-full" />
        <div className="mt-4 skeleton h-28 rounded-3xl" />
        <div className="mt-3 skeleton h-64 rounded-3xl" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm font-bold">Restaurant not found</p>
        <Link to="/restaurants" className="mt-3 inline-flex h-9 items-center rounded-full bg-brand px-4 text-[11px] font-bold text-white">
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-28 lg:pb-24">
      <section className="relative h-[248px] overflow-hidden rounded-b-[34px] sm:h-[310px] lg:h-[360px] lg:rounded-b-[40px]">
        <Image
          src={restaurant.cover}
          alt={restaurant.name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1100px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/25" />
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between sm:left-6 sm:right-6 lg:left-8 lg:right-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-lg backdrop-blur transition hover:bg-white"
            aria-label="Go back"
          >
            <ArrowLeft size={19} />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-lg backdrop-blur transition hover:bg-white"
              aria-label="Share restaurant"
            >
              <Share2 size={17} />
            </button>
            <button
              type="button"
              onClick={() => {
                const added = toggleFavorite(restaurant.id);
                toast[added ? "success" : "message"](
                  added ? "Added to favorites" : "Removed from favorites",
                );
              }}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full shadow-lg backdrop-blur transition hover:bg-white",
                isFavorite ? "bg-white text-brand" : "bg-white/95 text-ink",
              )}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={17} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-5 left-4 right-4 sm:left-6 sm:right-6 lg:left-8 lg:right-8">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide",
                restaurant.isOpen
                  ? "bg-emerald-500 text-white"
                  : "bg-rose-500 text-white",
              )}
            >
              {restaurant.isOpen ? "Open now" : "Closed"}
            </span>
            {restaurant.isFeatured && (
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur">
                Popular choice
              </span>
            )}
          </div>
          <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-[-0.04em] text-white sm:text-4xl">
            {restaurant.name}
          </h1>
          <p className="mt-1 text-xs text-white/75 sm:text-sm">
            {restaurant.cuisine}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[10px] font-medium text-white/85 sm:text-xs">
            <span className="inline-flex items-center gap-1">
              <Star size={12} className="fill-warning text-warning" />
              <span className="font-bold text-white">{restaurant.rating}</span>
              <span className="text-white/60">
                ({restaurant.ratingCount.toLocaleString()})
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 size={12} /> {restaurant.etaMin}–{restaurant.etaMax} min
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {restaurant.distanceKm} km
            </span>
            <span className="inline-flex items-center gap-1">
              <Bike size={12} /> {formatMMK(restaurant.deliveryFee)}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="sticky top-0 z-30 -mx-4 mt-4 border-b border-line/60 glass px-4 pb-2 pt-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <PillTabs
              tabs={[
                { value: "menu", label: "Menu" },
                {
                  value: "reviews",
                  label: "Reviews",
                  count: reviews.length,
                },
                { value: "about", label: "About" },
              ]}
              value={tab}
              onChange={(value) => setTab(value as Tab)}
            />
            <span className="hidden items-center gap-1 text-[10px] font-semibold text-muted sm:flex">
              <Wallet size={12} /> Min. {formatMMK(restaurant.minOrder)}
            </span>
          </div>
        </div>

        {tab === "menu" && (
          <div className="mt-4 flex gap-6">
            <aside className="hidden w-52 shrink-0 lg:block">
              <div className="sticky top-24 space-y-1.5">
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  Menu categories
                </p>
                {restaurant.categories.map((item) => {
                  const active = activeCategory === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveCategory(item.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-xs font-semibold transition",
                        active
                          ? "bg-brand text-white shadow-soft"
                          : "bg-white text-muted hover:bg-brand-soft/60 hover:text-ink",
                      )}
                    >
                      {item.name}
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px]",
                          active ? "bg-white/20" : "bg-cream",
                        )}
                      >
                        {item.items.length}
                      </span>
                    </button>
                  );
                })}
                <div className="mt-4 rounded-2xl border border-dashed border-brand/30 bg-brand-soft/40 p-3 text-[10px] leading-relaxed text-muted">
                  <p className="flex items-center gap-1.5 font-bold text-ink">
                    <Wallet size={13} className="text-brand" /> Cash on delivery
                  </p>
                  <p className="mt-1">
                    Pay the rider when your order arrives. No card details are
                    collected.
                  </p>
                </div>
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:hidden">
                {restaurant.categories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveCategory(item.id)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold transition",
                      activeCategory === item.id
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-white text-muted",
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              <div className="mt-1 flex items-end justify-between">
                <div>
                  <h2 className="text-base font-extrabold tracking-tight sm:text-lg">
                    {category?.name}
                  </h2>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {category?.items.length ?? 0} dishes · freshly prepared
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast("Search inside the menu is coming soon.")}
                  className="h-8 text-[10px]"
                >
                  Search menu
                </Button>
              </div>

              <div className="mt-3 grid gap-2.5 xl:grid-cols-2">
                {category?.items.map((item) => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    restaurant={restaurant}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
              <div className="flex items-end gap-3">
                <span className="text-5xl font-extrabold tracking-[-0.06em]">
                  {restaurant.rating.toFixed(1)}
                </span>
                <div className="pb-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <Star
                        key={score}
                        size={13}
                        className={
                          score <= Math.round(restaurant.rating)
                            ? "fill-warning text-warning"
                            : "text-line"
                        }
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-muted">
                    {restaurant.ratingCount.toLocaleString()} ratings
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {ratingBreakdown.map((row) => (
                  <div key={row.score} className="flex items-center gap-2">
                    <span className="w-3 text-[10px] font-semibold text-muted">
                      {row.score}
                    </span>
                    <Star size={10} className="fill-warning text-warning" />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${row.percent}%` }}
                      />
                    </div>
                    <span className="w-5 text-right text-[9px] text-muted">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                className="mt-5 w-full"
                onClick={openReview}
              >
                <MessageSquareText size={15} /> Write a review
              </Button>
            </div>

            <div className="space-y-2.5">
              {visibleReviews.length === 0 && (
                <div className="rounded-3xl border border-dashed border-line bg-cream/40 p-8 text-center">
                  <MessageSquareText
                    size={24}
                    className="mx-auto text-muted/50"
                  />
                  <p className="mt-2 text-xs font-bold">No reviews yet</p>
                  <p className="mt-1 text-[10px] text-muted">
                    Be the first to share how the food was.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={openReview}
                  >
                    Write the first review
                  </Button>
                </div>
              )}
              {visibleReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-3xl border border-line bg-white p-4 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={review.userName}
                      size={38}
                      color={colorFromString(review.userName)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="truncate text-xs font-bold">
                            {review.userName}
                          </p>
                          {!review.isApproved && (
                            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-700">
                              Pending
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-[9px] text-muted">
                          {formatDate(review.date)}
                        </span>
                      </div>
                      <div className="mt-1 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <Star
                            key={score}
                            size={10}
                            className={
                              score <= review.rating
                                ? "fill-warning text-warning"
                                : "text-line"
                            }
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-muted">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "about" && (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
              <h2 className="text-base font-extrabold tracking-tight">
                About {restaurant.name}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {restaurant.description}
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                    <MapPin size={16} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Address
                    </p>
                    <p className="mt-0.5 text-xs font-semibold">
                      {restaurant.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                    <Clock3 size={16} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Opening hours
                    </p>
                    <p className="mt-0.5 text-xs font-semibold">
                      {restaurant.hours}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                    <Bike size={16} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Delivery
                    </p>
                    <p className="mt-0.5 text-xs font-semibold">
                      {formatMMK(restaurant.deliveryFee)} · {restaurant.etaMin}–
                      {restaurant.etaMax} min
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
              <div className="relative h-[220px]">
                <Image
                  src={restaurant.cover}
                  alt={restaurant.name}
                  fill
                  sizes="600px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">
                      Find us in
                    </p>
                    <p className="text-sm font-extrabold text-white">
                      {restaurant.township}, Yangon
                    </p>
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${restaurant.lat}&mlon=${restaurant.lng}#map=16/${restaurant.lat}/${restaurant.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[10px] font-bold text-ink"
                  >
                    Directions <ChevronRight size={12} />
                  </a>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                  Popular tags
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {restaurant.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-semibold text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
      />
    </div>
  );
}
