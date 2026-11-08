import type { Order, OrderStatus, PaymentMethod } from "@/lib/types";

export type RevenuePoint = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

export type RestaurantPerformance = {
  id: string;
  name: string;
  image: string;
  orders: number;
  revenue: number;
  rating: number;
};

const DAY_MS = 86_400_000;

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function revenueByDay(orders: Order[], days = 7): RevenuePoint[] {
  const today = startOfDay(new Date());
  const buckets = new Map<string, RevenuePoint>();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * DAY_MS);
    const key = dayKey(date);
    buckets.set(key, {
      key,
      label: date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      revenue: 0,
      orders: 0,
    });
  }

  orders.forEach((order) => {
    if (order.status === "cancelled") return;
    const key = dayKey(new Date(order.placedAt));
    const bucket = buckets.get(key);
    if (!bucket) return;
    bucket.revenue += order.total;
    bucket.orders += 1;
  });

  return Array.from(buckets.values());
}

export function statusBreakdown(orders: Order[]) {
  const counts: Record<OrderStatus, number> = {
    pending_payment: 0,
    confirmed: 0,
    preparing: 0,
    on_the_way: 0,
    delivered: 0,
    cancelled: 0,
  };
  orders.forEach((order) => {
    counts[order.status] += 1;
  });
  return counts;
}

export function paymentBreakdown(orders: Order[]) {
  const counts: Record<PaymentMethod, number> = {
    cod: 0,
  };
  orders.forEach((order) => {
    counts[order.paymentMethod] += 1;
  });
  return counts;
}

export function topRestaurants(orders: Order[], limit = 5): RestaurantPerformance[] {
  const map = new Map<string, RestaurantPerformance>();
  orders.forEach((order) => {
    if (order.status === "cancelled") return;
    const current = map.get(order.restaurantId) ?? {
      id: order.restaurantId,
      name: order.restaurantName,
      image: order.restaurantImage,
      orders: 0,
      revenue: 0,
      rating: 0,
    };
    current.orders += 1;
    current.revenue += order.total;
    map.set(order.restaurantId, current);
  });
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function hourlyBreakdown(orders: Order[]) {
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const hour = index * 2;
    return {
      label: `${String(hour).padStart(2, "0")}:00`,
      orders: 0,
      revenue: 0,
    };
  });

  orders.forEach((order) => {
    if (order.status === "cancelled") return;
    const hour = new Date(order.placedAt).getHours();
    const bucket = buckets[Math.min(11, Math.floor(hour / 2))];
    bucket.orders += 1;
    bucket.revenue += order.total;
  });

  return buckets;
}

export type PeriodMetrics = {
  revenue: number;
  orders: number;
  cancelled: number;
  delivered: number;
  cancelRate: number;
  averageOrder: number;
};

/** Metrics for a rolling window of `days`, optionally offset by whole periods. */
export function periodMetrics(
  orders: Order[],
  days: number,
  offsetPeriods = 0,
): PeriodMetrics {
  const today = startOfDay(new Date());
  const end = today.getTime() + DAY_MS - offsetPeriods * days * DAY_MS;
  const start = end - days * DAY_MS;

  const scoped = orders.filter((order) => {
    const placed = new Date(order.placedAt).getTime();
    return placed >= start && placed < end;
  });

  const cancelled = scoped.filter((order) => order.status === "cancelled");
  const delivered = scoped.filter((order) => order.status === "delivered");
  const deliveredRevenue = delivered.reduce((sum, order) => sum + order.total, 0);
  const revenue = scoped
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  return {
    revenue,
    orders: scoped.length,
    cancelled: cancelled.length,
    delivered: delivered.length,
    cancelRate: scoped.length
      ? Math.round((cancelled.length / scoped.length) * 1000) / 10
      : 0,
    averageOrder: delivered.length
      ? Math.round(deliveredRevenue / delivered.length)
      : 0,
  };
}

/** Current rolling window plus the equally sized window immediately before it. */
export function periodComparison(orders: Order[], days: number) {
  return {
    current: periodMetrics(orders, days, 0),
    previous: periodMetrics(orders, days, 1),
  };
}

export function orderSummary(orders: Order[]) {
  const delivered = orders.filter((order) => order.status === "delivered");
  const cancelled = orders.filter((order) => order.status === "cancelled");
  const active = orders.filter((order) =>
    ["confirmed", "preparing", "on_the_way"].includes(order.status),
  );
  const revenue = delivered.reduce((sum, order) => sum + order.total, 0);
  const todayKey = dayKey(new Date());
  const todayOrders = orders.filter(
    (order) => dayKey(new Date(order.placedAt)) === todayKey,
  );
  const todayRevenue = todayOrders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  const uniqueCustomers = new Set(orders.map((order) => order.userEmail)).size;

  return {
    revenue,
    todayRevenue,
    todayOrders: todayOrders.length,
    active: active.length,
    delivered: delivered.length,
    cancelled: cancelled.length,
    total: orders.length,
    averageOrder: delivered.length ? Math.round(revenue / delivered.length) : 0,
    uniqueCustomers,
    cancelRate: orders.length
      ? Math.round((cancelled.length / orders.length) * 1000) / 10
      : 0,
  };
}

export function formatCompactMMK(value: number) {
  if (value >= 1_000_000) return `Ks ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Ks ${Math.round(value / 1000)}k`;
  return `Ks ${Math.round(value)}`;
}
