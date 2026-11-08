import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { useAdminStore } from "@/lib/store/admin";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReviewDialog({
  open,
  onClose,
  restaurantId,
  restaurantName,
  initialRating = 5,
}: {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  initialRating?: number;
}) {
  const user = useAuthStore((state) => state.user);
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRating(initialRating);
    setComment("");
    setSubmitting(false);
  }, [open, initialRating]);

  const submit = async () => {
    if (!user) {
      toast.error("Sign in to write a review.");
      onClose();
      return;
    }

    const trimmed = comment.trim();
    if (!rating) {
      toast.error("Choose a star rating first.");
      return;
    }
    if (trimmed.length < 4) {
      toast.error("Please write a short comment (at least 4 characters).");
      return;
    }

    setSubmitting(true);
    const review: Review = {
      id: `rev-${crypto.randomUUID()}`,
      restaurantId,
      userId: user.id,
      userName: user.name,
      rating,
      comment: trimmed,
      date: new Date().toISOString(),
      isApproved: false,
    };

    const saved = await useAdminStore.getState().createReview(review);
    setSubmitting(false);

    if (!saved) {
      toast.error("We could not submit your review. Please try again.");
      return;
    }

    toast.success("Review submitted — it will appear after admin approval.");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting) onClose();
      }}
      title="Write a review"
      description={restaurantName}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button size="sm" disabled={submitting} onClick={() => void submit()}>
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Posting…
              </>
            ) : (
              "Post review"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            Your rating
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setRating(score)}
                aria-label={`${score} star${score === 1 ? "" : "s"}`}
                className="rounded-full p-1 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Star
                  size={34}
                  className={cn(
                    "transition",
                    score <= rating
                      ? "fill-warning text-warning"
                      : "text-line",
                  )}
                />
              </button>
            ))}
            <span className="ml-1 text-sm font-extrabold text-ink">
              {rating}.0
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted"
          >
            Your review
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="How was the food and delivery?"
            className="mt-2 w-full resize-none rounded-2xl border border-line bg-cream/50 px-3.5 py-3 text-sm leading-relaxed outline-none transition placeholder:text-muted/60 focus:border-brand/40 focus:bg-white"
          />
          <div className="mt-1.5 flex items-center justify-between text-[9px] text-muted">
            <span>
              {user ? `Posting as ${user.name}` : "Sign in to post a review"}
            </span>
            <span>{comment.length}/500</span>
          </div>
        </div>

        <p className="rounded-2xl bg-brand-soft/40 px-3 py-2.5 text-[10px] leading-relaxed text-muted">
          Reviews help other foodies choose. Your review appears after the YumGo
          team approves it.
        </p>
      </div>
    </Modal>
  );
}
