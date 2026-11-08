import { create } from "zustand";
import type { AdminUser, Promotion, Review } from "@/lib/types";
import {
  fetchPromotions,
  createPromotion as createPromotionRemote,
  updatePromotionRemote,
  deletePromotionRemote,
} from "@/lib/db/promotions";
import {
  fetchReviews,
  setReviewApproved as setReviewApprovedRemote,
  deleteReviewRemote,
  createReview as createReviewRemote,
} from "@/lib/db/reviews";
import { fetchProfiles, updateProfileRemote } from "@/lib/db/users";
import { getSupabaseClient } from "@/lib/supabase";

type AdminState = {
  promotions: Promotion[];
  reviews: Review[];
  users: AdminUser[];
  readNotificationIds: string[];
  loaded: boolean;
  loading: boolean;
  hydrate: () => Promise<void>;
  markNotificationsRead: (ids: string[]) => void;
  updatePromotion: (id: string, patch: Partial<Promotion>) => Promise<boolean>;
  addPromotion: (promotion: Promotion) => Promise<boolean>;
  deletePromotion: (id: string) => Promise<boolean>;
  setReviewApproved: (id: string, isApproved: boolean) => Promise<boolean>;
  deleteReview: (id: string) => Promise<boolean>;
  createReview: (review: Review) => Promise<boolean>;
  updateUser: (id: string, patch: Partial<AdminUser>) => Promise<boolean>;
};

export const useAdminStore = create<AdminState>()((set, get) => ({
  promotions: [],
  reviews: [],
  users: [],
  readNotificationIds: [],
  loaded: false,
  loading: false,

  hydrate: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      set({ promotions: [], reviews: [], users: [], loaded: true, loading: false });
      return;
    }

    set({ loading: true });
    const [promotions, reviews, users] = await Promise.all([
      fetchPromotions(),
      fetchReviews(),
      fetchProfiles(),
    ]);

    set({
      promotions,
      reviews,
      users,
      loaded: true,
      loading: false,
    });
  },

  updatePromotion: async (id, patch) => {
    const saved = await updatePromotionRemote(id, patch);
    if (!saved) return false;
    set({
      promotions: get().promotions.map((promotion) =>
        promotion.id === id ? { ...promotion, ...patch } : promotion,
      ),
    });
    return true;
  },

  addPromotion: async (promotion) => {
    const saved = await createPromotionRemote(promotion);
    if (!saved) return false;
    set({ promotions: [promotion, ...get().promotions] });
    return true;
  },

  deletePromotion: async (id) => {
    const saved = await deletePromotionRemote(id);
    if (!saved) return false;
    set({
      promotions: get().promotions.filter((promotion) => promotion.id !== id),
    });
    return true;
  },

  setReviewApproved: async (id, isApproved) => {
    const saved = await setReviewApprovedRemote(id, isApproved);
    if (!saved) return false;
    set({
      reviews: get().reviews.map((review) =>
        review.id === id ? { ...review, isApproved } : review,
      ),
    });
    return true;
  },

  deleteReview: async (id) => {
    const saved = await deleteReviewRemote(id);
    if (!saved) return false;
    set({ reviews: get().reviews.filter((review) => review.id !== id) });
    return true;
  },

  createReview: async (review) => {
    const saved = await createReviewRemote(review);
    if (!saved) return false;
    set({ reviews: [review, ...get().reviews] });
    return true;
  },

  updateUser: async (id, patch) => {
    const saved = await updateProfileRemote(id, {
      role: patch.role,
      status: patch.status,
      name: patch.name,
      phone: patch.phone,
    });
    if (!saved) return false;
    set({
      users: get().users.map((user) =>
        user.id === id ? { ...user, ...patch } : user,
      ),
    });
    return true;
  },

  markNotificationsRead: (ids) => {
    set({
      readNotificationIds: Array.from(
        new Set([...get().readNotificationIds, ...ids]),
      ),
    });
  },
}));
