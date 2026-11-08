import { Link } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RestaurantCard } from "@/components/restaurant-card";
import { EmptyState } from "@/components/empty-state";
import { useMounted } from "@/components/providers";
import { useFavoritesStore } from "@/lib/store/favorites";
import { useCatalog } from "@/lib/use-catalog";

export default function FavoritesPage() {
  const mounted = useMounted();
  const catalog = useCatalog();
  const ids = useFavoritesStore((state) => state.ids);
  const saved = catalog.filter((restaurant) => ids.includes(restaurant.id));

  return (
    <div className="pb-6">
      <PageHeader
        title="Favorites"
        subtitle="Your saved kitchens, ready when you are."
        showBack={false}
        right={
          <Link
            to="/restaurants"
            className="flex h-10 items-center gap-1 rounded-full border border-line bg-white px-3 text-[11px] font-bold text-brand transition hover:border-brand/30"
          >
            <Sparkles size={14} /> Discover
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 rounded-3xl border border-brand/20 bg-brand-soft/40 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand shadow-sm">
            <Heart size={20} fill="currentColor" />
          </span>
          <div>
            <p className="text-sm font-extrabold">
              {saved.length} saved restaurant{saved.length === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-[10px] text-muted">
              Tap the heart on any restaurant to save it here.
            </p>
          </div>
        </div>

        <div className="mt-4">
          {!mounted ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="skeleton aspect-[4/5] rounded-3xl" />
              ))}
            </div>
          ) : saved.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {saved.map((restaurant, index) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  priority={index < 4}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Heart size={26} />}
              title="No favorites yet"
              description="Save the restaurants you love so you can find them again in one tap."
              actionLabel="Explore restaurants"
              actionHref="/restaurants"
            />
          )}
        </div>
      </div>

    </div>
  );
}
