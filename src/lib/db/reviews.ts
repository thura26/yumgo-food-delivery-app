import { getSupabaseClient } from "@/lib/supabase";
import type { Review } from "@/lib/types";

type ReviewRow = {
  id: string;
  restaurant_id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_approved: boolean;
};

function rowToReview(r: ReviewRow): Review {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    userId: r.user_id ?? undefined,
    userName: r.user_name,
    rating: r.rating,
    comment: r.comment,
    date: r.created_at,
    isApproved: r.is_approved,
  };
}

export async function fetchReviews(restaurantId?: string): Promise<Review[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  let q = supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (restaurantId) q = q.eq("restaurant_id", restaurantId);
  const { data, error } = await q;
  if (error || !data) return [];
  return (data as ReviewRow[]).map(rowToReview);
}

export async function setReviewApproved(id: string, isApproved: boolean): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("reviews").update({ is_approved: isApproved }).eq("id", id);
  if (error) { console.error("setReviewApproved", error); return false; }
  return true;
}

export async function deleteReviewRemote(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) { console.error("deleteReview", error); return false; }
  return true;
}

export async function createReview(review: Review): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  // Reviews are tied to the signed-in customer and start unapproved.
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return false;

  const { error } = await supabase.from("reviews").insert({
    id: review.id,
    restaurant_id: review.restaurantId,
    user_id: sessionData.session.user.id,
    user_name: review.userName,
    rating: review.rating,
    comment: review.comment,
    created_at: review.date,
    // The customer insert policy only accepts unapproved reviews. Admins
    // publish them from the moderation screen.
    is_approved: false,
  });
  if (error) { console.error("createReview", error); return false; }
  return true;
}