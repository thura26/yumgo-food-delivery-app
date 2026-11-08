import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChefHat,
  MessageSquareText,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/ui";
import { Avatar } from "@/components/avatar";
import { PillTabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/components/providers";
import { useAdminStore } from "@/lib/store/admin";
import { useCatalog } from "@/lib/use-catalog";
import type { Review } from "@/lib/types";
import { cn, formatDate, timeAgo } from "@/lib/utils";

type Filter = "all" | "pending" | "approved";

function Stars({ value, size = 11 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((score) => (
        <Star
          key={score}
          size={size}
          className={
            score <= value ? "fill-warning text-warning" : "text-line"
          }
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const mounted = useMounted();
  const reviews = useAdminStore((state) => state.reviews);
  const catalog = useCatalog();
  const setReviewApproved = useAdminStore((state) => state.setReviewApproved);
  const deleteReview = useAdminStore((state) => state.deleteReview);
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState<number | "all">("all");

  const counts = useMemo(
    () => ({
      all: reviews.length,
      pending: reviews.filter((review) => !review.isApproved).length,
      approved: reviews.filter((review) => review.isApproved).length,
    }),
    [reviews],
  );

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews
      .filter((review) => {
        const matchesFilter =
          filter === "all"
            ? true
            : filter === "pending"
              ? !review.isApproved
              : review.isApproved;
        const matchesQuery =
          !q ||
          review.userName.toLowerCase().includes(q) ||
          review.comment.toLowerCase().includes(q) ||
          review.restaurantId.toLowerCase().includes(q);
        const matchesRating = rating === "all" || review.rating === rating;
        return matchesFilter && matchesQuery && matchesRating;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reviews, filter, query, rating]);

  const toggle = (review: Review) => {
    setReviewApproved(review.id, !review.isApproved);
    toast.success(
      review.isApproved
        ? `${review.userName}'s review hidden`
        : `${review.userName}'s review approved`,
    );
  };

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

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total reviews",
            value: counts.all,
            icon: <MessageSquareText size={16} />,
            tone: "bg-brand-soft text-brand-dark",
          },
          {
            label: "Average rating",
            value: average.toFixed(1),
            icon: <Star size={16} />,
            tone: "bg-amber-50 text-amber-600",
          },
          {
            label: "Pending approval",
            value: counts.pending,
            icon: <XCircle size={16} />,
            tone: "bg-rose-50 text-rose-600",
          },
          {
            label: "Published",
            value: counts.approved,
            icon: <CheckCircle2 size={16} />,
            tone: "bg-emerald-50 text-emerald-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-white p-3.5 shadow-card"
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl",
                stat.tone,
              )}
            >
              {stat.icon}
            </span>
            <p className="mt-2 text-xl font-extrabold tracking-tight">{stat.value}</p>
            <p className="text-[9px] font-semibold text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <AdminCard
        title="Review moderation"
        subtitle="Approve feedback before it appears on restaurant pages"
        action={
          <span className="rounded-full bg-cream px-2.5 py-1 text-[9px] font-bold text-muted">
            {filtered.length} shown
          </span>
        }
        bodyClassName="p-0 sm:p-0"
      >
        <div className="space-y-3 border-b border-line/70 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-line bg-cream/60 px-3">
              <Search size={15} className="shrink-0 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reviews, customers or restaurants..."
                className="h-full w-full bg-transparent text-[11px] outline-none placeholder:text-muted/60"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-muted hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="flex rounded-xl border border-line bg-cream/60 p-1">
              <button
                type="button"
                onClick={() => setRating("all")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[9px] font-bold transition",
                  rating === "all" ? "bg-ink text-white" : "text-muted",
                )}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-[9px] font-bold transition",
                    rating === value ? "bg-ink text-white" : "text-muted",
                  )}
                >
                  {value} <Star size={8} className="fill-current" />
                </button>
              ))}
            </div>
          </div>
          <PillTabs
            size="sm"
            tabs={[
              { value: "all", label: "All", count: counts.all },
              { value: "pending", label: "Pending", count: counts.pending },
              { value: "approved", label: "Published", count: counts.approved },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div className="space-y-2.5 p-4 sm:p-5">
          {filtered.map((review) => {
            const restaurant = catalog.find(
              (item) => item.id === review.restaurantId,
            );
            return (
              <article
                key={review.id}
                className={cn(
                  "rounded-2xl border p-3.5 transition",
                  review.isApproved
                    ? "border-line bg-white"
                    : "border-amber-200/70 bg-amber-50/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    name={review.userName}
                    size={36}
                    color={review.isApproved ? "#00B14F" : "#F59E0B"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[11px] font-extrabold">{review.userName}</p>
                      <span className="h-0.5 w-0.5 rounded-full bg-muted/50" />
                      <p className="text-[9px] text-muted">
                        {restaurant?.name ?? "YumGo restaurant"}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide",
                          review.isApproved
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {review.isApproved ? "Published" : "Pending"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Stars value={review.rating} />
                      <span className="text-[9px] text-muted">
                        {timeAgo(review.date)} · {formatDate(review.date)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                      {review.comment}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggle(review)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition",
                        review.isApproved
                          ? "text-muted hover:bg-rose-50 hover:text-rose-600"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
                      )}
                      aria-label={
                        review.isApproved ? "Unpublish review" : "Approve review"
                      }
                    >
                      {review.isApproved ? (
                        <ThumbsDown size={14} />
                      ) : (
                        <ThumbsUp size={14} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteReview(review.id);
                        toast.success("Review deleted");
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete review"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-cream/40 p-10 text-center">
              <ChefHat size={22} className="mx-auto text-muted/50" />
              <p className="mt-2 text-xs font-bold">Nothing to moderate</p>
              <p className="mt-1 text-[10px] text-muted">
                {filter === "pending"
                  ? "All reviews are approved. Great job!"
                  : "Try a different filter or search term."}
              </p>
              {filter === "pending" && counts.approved > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setFilter("all")}
                >
                  View all reviews
                </Button>
              )}
            </div>
          )}
        </div>
      </AdminCard>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "5-star reviews",
            value: reviews.filter((review) => review.rating === 5).length,
            hint: "Delighted customers",
            color: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "1–2 star reviews",
            value: reviews.filter((review) => review.rating <= 2).length,
            hint: "Needs attention",
            color: "bg-rose-50 text-rose-600",
          },
          {
            label: "Approval rate",
            value: `${counts.all ? Math.round((counts.approved / counts.all) * 100) : 0}%`,
            hint: "Published vs total",
            color: "bg-brand-soft text-brand-dark",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-line bg-white p-3.5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
                {item.label}
              </p>
              <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", item.color)}>
                {item.value}
              </span>
            </div>
            <p className="mt-2 text-[10px] text-muted">{item.hint}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-[9px] text-muted/60">
        Approving a review publishes it to the matching restaurant page in the
        customer app.
      </p>
    </div>
  );
}
