import { getSupabaseClient } from "@/lib/supabase";
import type { Address } from "@/lib/types";

type AddressRow = {
  id: string;
  user_id: string;
  label: string;
  line: string;
  township: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  is_default: boolean;
};

function mapRow(row: AddressRow): Address {
  return {
    id: row.id,
    label: row.label,
    line: row.line,
    township: row.township,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    isDefault: row.is_default,
  };
}

function toRow(userId: string, address: Address) {
  return {
    id: address.id,
    user_id: userId,
    label: address.label,
    line: address.line,
    township: address.township,
    city: address.city,
    lat: address.lat,
    lng: address.lng,
    phone: address.phone,
    is_default: Boolean(address.isDefault),
  };
}

function toPatch(patch: Partial<Address>) {
  const row: Record<string, unknown> = {};

  if (patch.label !== undefined) row.label = patch.label;
  if (patch.line !== undefined) row.line = patch.line;
  if (patch.township !== undefined) row.township = patch.township;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.lat !== undefined) row.lat = patch.lat;
  if (patch.lng !== undefined) row.lng = patch.lng;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.isDefault !== undefined) row.is_default = patch.isDefault;

  return row;
}

async function getSessionUserId() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function fetchRemoteAddresses(userId: string): Promise<{
  ok: boolean;
  addresses: Address[];
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, addresses: [] };

  const sessionUserId = await getSessionUserId();
  if (sessionUserId !== userId) return { ok: false, addresses: [] };

  const { data, error } = await supabase
    .from("addresses")
    .select(
      "id, user_id, label, line, township, city, lat, lng, phone, is_default",
    )
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error || !data) return { ok: false, addresses: [] };

  return {
    ok: true,
    addresses: (data as AddressRow[]).map(mapRow),
  };
}

export async function upsertRemoteAddress(
  userId: string,
  address: Address,
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const sessionUserId = await getSessionUserId();
  if (sessionUserId !== userId) return false;

  const { error } = await supabase
    .from("addresses")
    .upsert(toRow(userId, address), { onConflict: "id" });

  return !error;
}

export async function updateRemoteAddress(
  userId: string,
  id: string,
  patch: Partial<Address>,
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const sessionUserId = await getSessionUserId();
  if (sessionUserId !== userId) return false;

  const row = toPatch(patch);
  if (Object.keys(row).length === 0) return true;

  const { error } = await supabase
    .from("addresses")
    .update(row)
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}

export async function deleteRemoteAddress(
  userId: string,
  id: string,
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const sessionUserId = await getSessionUserId();
  if (sessionUserId !== userId) return false;

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}

/**
 * Marking one address as default relies on the
 * `addresses_single_default` trigger to clear the previous default.
 */
export async function setRemoteDefaultAddress(
  userId: string,
  id: string,
): Promise<boolean> {
  return updateRemoteAddress(userId, id, { isDefault: true });
}
