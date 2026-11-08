import { getSupabaseClient } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/lib/types";

type OrderRow = {
  id: string;
  code: string;
  user_id: string | null;
  user_email: string;
  customer_name: string;
  customer_phone: string;
  restaurant_id: string | null;
  restaurant_name: string;
  restaurant_image: string;
  restaurant_township: string;
  items: unknown;
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  address: string;
  lat: number;
  lng: number;
  notes: string;
  driver: unknown;
  events: unknown;
  auto_advance: boolean;
  placed_at: string;
};

function rowToOrder(r: OrderRow): Order {
  return {
    id: r.id,
    code: r.code,
    userId: r.user_id ?? undefined,
    userEmail: r.user_email,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    restaurantId: r.restaurant_id ?? "",
    restaurantName: r.restaurant_name,
    restaurantImage: r.restaurant_image,
    restaurantTownship: r.restaurant_township,
    items: (r.items as Order["items"]) ?? [],
    subtotal: r.subtotal,
    deliveryFee: r.delivery_fee,
    serviceFee: r.service_fee,
    discount: r.discount,
    total: r.total,
    status: r.status,
    paymentMethod: r.payment_method as Order["paymentMethod"],
    paymentStatus: r.payment_status as Order["paymentStatus"],
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    notes: r.notes,
    placedAt: r.placed_at,
    driver: (r.driver as Order["driver"]) ?? ({} as Order["driver"]),
    events: (r.events as Order["events"]) ?? [],
    autoAdvance: r.auto_advance,
  };
}

export async function fetchOrders(): Promise<Order[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("placed_at", { ascending: false });

  if (error || !data) return [];
  return (data as OrderRow[]).map(rowToOrder);
}

export async function createOrderRemote(
  order: Order,
  userId: string,
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.from("orders").insert({
    id: order.id,
    code: order.code,
    user_id: userId,
    user_email: order.userEmail,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    restaurant_id: order.restaurantId || null,
    restaurant_name: order.restaurantName,
    restaurant_image: order.restaurantImage,
    restaurant_township: order.restaurantTownship,
    items: order.items,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    service_fee: order.serviceFee,
    discount: order.discount,
    total: order.total,
    status: order.status,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    address: order.address,
    lat: order.lat,
    lng: order.lng,
    notes: order.notes,
    driver: order.driver,
    events: order.events,
    auto_advance: order.autoAdvance ?? false,
    placed_at: order.placedAt,
  });

  if (error) {
    console.error("createOrder", error);
    return false;
  }
  return true;
}

export async function updateOrderStatusRemote(
  id: string,
  status: OrderStatus,
  patch?: Partial<Order>,
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const row: Record<string, unknown> = { status };
  if (patch?.paymentStatus) row.payment_status = patch.paymentStatus;
  if (patch?.events) row.events = patch.events;
  if (patch?.autoAdvance !== undefined) row.auto_advance = patch.autoAdvance;

  const { error } = await supabase.from("orders").update(row).eq("id", id);
  if (error) {
    console.error("updateOrderStatus", error);
    return false;
  }
  return true;
}

/**
 * Customers may only advance their own auto-advance orders. The database
 * function validates ownership and the allowed forward transition, so the
 * simulated delivery cannot be used to mark arbitrary orders as delivered.
 */
export async function advanceOrderStatusRemote(
  id: string,
): Promise<OrderStatus | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("advance_order_status", {
    p_order_id: id,
  });

  if (error || !data) {
    console.error("advanceOrderStatus", error);
    return null;
  }
  return data as OrderStatus;
}

export async function deleteOrderRemote(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) {
    console.error("deleteOrder", error);
    return false;
  }
  return true;
}
