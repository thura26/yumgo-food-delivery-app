import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, SearchX, SlidersHorizontal } from "lucide-react";
import { filterRestaurants, homeCategories } from "@/lib/catalog-utils";
import { useCatalog } from "@/lib/use-catalog";
import { SearchBar } from "@/components/search-bar";
import { RestaurantCard } from "@/components/restaurant-card";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

type Sort = "recommended" | "rating" | "fastest" | "nearest" | "open";

const sortOptions: { value: Sort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Top rated" },
  { value: "fastest", label: "Fastest" },
  { value: "nearest", label: "Nearest" },
  { value: "open", label: "Open now" },
];

export function RestaurantsClient() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const catalog = useCatalog();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(
    searchParams.get("category") ?? "All",
  );
  const [sort, setSort] = useState<Sort>("recommended");

  const results = useMemo(() => {
    let list = filterRestaurants(catalog, query, category);
    if (sort === "open") list = list.filter((restaurant) => restaurant.isOpen);
    return [...list].sort((a, b) => {
      switch (sort) {
        case "rating":
          return b.rating - a.rating;
        case "fastest":
          return a.etaMax - b.etaMax;
        case "nearest":
          return a.distanceKm - b.distanceKm;
        case "recommended":
        default:
          return Number(b.isFeatured) - Number(a.isFeatured) || b.rating - a.rating;
      }
    });
  }, [catalog, query, category, sort]);

  return (
    <div className="px-4 pb-6 pt-4 sm:px-6 lg:px-8 lg:pt-7">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/home")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition hover:border-brand/30"
          aria-label="Back to home"
        >
          <ArrowLeft size={19} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
            Discover
          </p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight sm:text-2xl">
            Restaurants near you
          </h1>
        </div>
        <Link
          to="/favorites"
          className="hidden h-10 items-center rounded-full border border-line bg-white px-4 text-xs font-bold text-ink transition hover:border-brand/30 sm:inline-flex"
        >
          Favorites
        </Link>
      </header>

      <div className="mx-auto mt-4 w-full max-w-6xl">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search restaurants, dishes or cuisines..."
          showFilter
          onFilter={() => setSort("open")}
        />
      </div>

      <div className="mx-auto mt-4 w-full max-w-6xl">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {homeCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.tag)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition",
                category === item.tag
                  ? "border-brand bg-brand text-white shadow-soft"
                  : "border-line bg-white text-muted hover:border-brand/30 hover:text-ink",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
            <SlidersHorizontal size={12} /> Sort
          </span>
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSort(option.value)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold transition",
                sort === option.value
                  ? "bg-ink text-white"
                  : "bg-white text-muted hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted">
            <span className="font-extrabold text-ink">{results.length}</span>{" "}
            restaurant{results.length === 1 ? "" : "s"} found
          </p>
          <p className="text-[10px] text-muted">Hlaing, Yangon · 3 km</p>
        </div>

        {results.length ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((restaurant, index) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            icon={<SearchX size={26} />}
            title="No restaurants found"
            description="Try a different keyword or clear your filters to see all kitchens near you."
            actionLabel="Clear filters"
            actionHref="/restaurants"
          />
        )}
      </div>

    </div>
  );
}
