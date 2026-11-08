import { getSupabaseClient } from "@/lib/supabase";
import type { Promotion } from "@/lib/types";

type PromoRow = {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  min_order: number;
  max_discount: number | null;
  ends_at: string;
  is_active: boolean;
  usage_count: number;
  usage_limit: number;
};

function rowToPromo(r: PromoRow): Promotion {
  return {
    id: r.id,
    code: r.code,
    description: r.description,
    type: r.type,
    value: r.value,
    minOrder: r.min_order,
    maxDiscount: r.max_discount ?? undefined,
    endsAt: r.ends_at,
    isActive: r.is_active,
    usageCount: r.usage_count,
    usageLimit: r.usage_limit,
  };
}

export async function fetchPromotions(): Promise<Promotion[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("promotions").select("*").order("code");
  if (error || !data) return [];
  return (data as PromoRow[]).map(rowToPromo);
}

export async function createPromotion(promo: Promotion): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("promotions").insert({
    id: promo.id,
    code: promo.code,
    description: promo.description,
    type: promo.type,
    value: promo.value,
    min_order: promo.minOrder,
    max_discount: promo.maxDiscount ?? null,
    ends_at: promo.endsAt,
    is_active: promo.isActive,
    usage_count: promo.usageCount,
    usage_limit: promo.usageLimit,
  });
  if (error) { console.error("createPromotion", error); return false; }
  return true;
}

export async function updatePromotionRemote(id: string, patch: Partial<Promotion>): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const row: Record<string, unknown> = {};
  if (patch.code !== undefined) row.code = patch.code;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.value !== undefined) row.value = patch.value;
  if (patch.minOrder !== undefined) row.min_order = patch.minOrder;
  if (patch.maxDiscount !== undefined) row.max_discount = patch.maxDiscount ?? null;
  if (patch.endsAt !== undefined) row.ends_at = patch.endsAt;
  if (patch.isActive !== undefined) row.is_active = patch.isActive;
  if (patch.usageCount !== undefined) row.usage_count = patch.usageCount;
  if (patch.usageLimit !== undefined) row.usage_limit = patch.usageLimit;
  if (Object.keys(row).length === 0) return true;
  const { error } = await supabase.from("promotions").update(row).eq("id", id);
  if (error) { console.error("updatePromotion", error); return false; }
  return true;
}

export async function deletePromotionRemote(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) { console.error("deletePromotion", error); return false; }
  return true;
}