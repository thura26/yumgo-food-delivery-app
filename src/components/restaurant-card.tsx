import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import { Bike, Clock, Heart, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import type { Restaurant } from "@/lib/types";
import { cn, formatMMK } from "@/lib/utils";
import { useFavoritesStore } from "@/lib/store/favorites";
import { useMounted } from "@/components/providers";

export function RestaurantCard({
  restaurant,
  variant = "grid",
  className,
  priority,
}: {
  restaurant: Restaurant;
  variant?: "grid" | "horizontal";
  className?: string;
  priority?: boolean;
}) {
  const mounted = useMounted();
  const ids = useFavoritesStore((state) => state.ids);
  const toggle = useFavoritesStore((state) => state.toggle);
  const isFavorite = mounted && ids.includes(restaurant.id);

  const favoriteButton = (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const added = toggle(restaurant.id);
        toast[added ? "success" : "message"](
          added
            ? `${restaurant.name} added to favorites`
            : `${restaurant.name} removed from favorites`,
        );
      }}
      className={cn(
        "absolute right-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur transition hover:scale-105",
        isFavorite ? "text-brand" : "text-ink/70",
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart size={15} fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );

  if (variant === "horizontal") {
    return (
      <article
        className={cn(
          "relative flex gap-3 rounded-2xl border border-line bg-white p-2.5 shadow-card card-hover",
          className,
        )}
      >
        <Link
          to={`/restaurants/${restaurant.slug}`}
          className="absolute inset-0 z-10 rounded-2xl"
          aria-label={`Open ${restaurant.name}`}
        />
        <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-xl">
          <Image
            src={restaurant.cover}
            alt={restaurant.name}
            fill
            sizes="92px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 py-0.5 pr-6">
          <h3 className="truncate text-sm font-bold">{restaurant.name}</h3>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {restaurant.cuisine}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
            <span className="inline-flex items-center gap-1 font-semibold text-ink">
              <Star size={10} className="fill-warning text-warning" />
              {restaurant.rating}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={10} />
              {restaurant.etaMin}–{restaurant.etaMax} min
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] text-muted">
              {formatMMK(restaurant.deliveryFee)} delivery
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-bold",
                restaurant.isOpen
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-600",
              )}
            >
              {restaurant.isOpen ? "Open" : "Closed"}
            </span>
          </div>
        </div>
        {favoriteButton}
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-line bg-white p-2.5 shadow-card card-hover",
        className,
      )}
    >
      <Link
        to={`/restaurants/${restaurant.slug}`}
        className="absolute inset-0 z-10"
        aria-label={`Open ${restaurant.name}`}
      />
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        <Image
          src={restaurant.cover}
          alt={restaurant.name}
          fill
          priority={priority}
          sizes="(max-width: 768px) 50vw, 320px"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-ink shadow-sm backdrop-blur">
          <Star size={10} className="fill-warning text-warning" />
          {restaurant.rating}
          <span className="font-medium text-muted">
            ({restaurant.ratingCount.toLocaleString()})
          </span>
        </span>
        {restaurant.isFeatured && (
          <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
            Popular
          </span>
        )}
        {!restaurant.isOpen && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-bold text-white">
            Currently closed
          </span>
        )}
      </div>
      {favoriteButton}
      <div className="px-1 pb-0.5 pt-2.5">
        <h3 className="truncate text-[13px] font-bold sm:text-sm">
          {restaurant.name}
        </h3>
        <p className="mt-0.5 truncate text-[10px] text-muted sm:text-[11px]">
          {restaurant.cuisine}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock size={10} />
            {restaurant.etaMin}–{restaurant.etaMax} min
          </span>
          <span className="h-0.5 w-0.5 rounded-full bg-muted/50" />
          <span className="inline-flex items-center gap-1">
            <MapPin size={10} />
            {restaurant.distanceKm} km
          </span>
        </div>
      </div>
    </article>
  );
}

export function RestaurantSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white p-2.5">
      <div className="skeleton aspect-[4/3] rounded-2xl" />
      <div className="space-y-2 px-1 pt-3">
        <div className="skeleton h-3.5 w-3/4 rounded-full" />
        <div className="skeleton h-2.5 w-1/2 rounded-full" />
        <div className="skeleton h-2.5 w-2/3 rounded-full" />
      </div>
    </div>
  );
}

export function RestaurantMiniCard({
  restaurant,
  className,
}: {
  restaurant: Restaurant;
  className?: string;
}) {
  return (
    <Link
      to={`/restaurants/${restaurant.slug}`}
      className={cn(
        "flex min-w-[180px] items-center gap-2.5 rounded-2xl border border-line bg-white p-2 shadow-card transition hover:border-brand/30",
        className,
      )}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
        <Image
          src={restaurant.cover}
          alt={restaurant.name}
          fill
          sizes="48px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold">{restaurant.name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted">
          <Bike size={10} /> {restaurant.etaMin} min
        </p>
      </div>
    </Link>
  );
}
