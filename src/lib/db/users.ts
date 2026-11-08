import { getSupabaseClient } from "@/lib/supabase";
import { colorFromString } from "@/lib/utils";
import type { AdminUser } from "@/lib/types";

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "customer" | "admin";
  status: "active" | "blocked";
  created_at: string;
};

export async function fetchProfiles(): Promise<AdminUser[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, phone, role, status, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  // order counts per email from orders table
  const { data: orders } = await supabase
    .from("orders")
    .select("user_email");
  const counts = new Map<string, number>();
  for (const o of orders ?? []) {
    const e = (o as { user_email: string }).user_email?.toLowerCase();
    if (e) counts.set(e, (counts.get(e) ?? 0) + 1);
  }
  return (data as ProfileRow[]).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone ?? "—",
    role: p.role,
    orders: counts.get(p.email.toLowerCase()) ?? 0,
    joinedAt: p.created_at,
    status: p.status,
    avatarColor: p.email ? colorFromString(p.email) : "#00B14F",
  }));
}

export async function updateProfileRemote(
  id: string,
  patch: { role?: "customer" | "admin"; status?: "active" | "blocked"; name?: string; phone?: string },
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const row: Record<string, unknown> = {};
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (Object.keys(row).length === 0) return true;
  const { error } = await supabase.from("profiles").update(row).eq("id", id);
  if (error) { console.error("updateProfile", error); return false; }
  return true;
}