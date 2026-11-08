import type { AuthUser, Order, OrderStatus } from "@/lib/types";

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "confirmed",
  "preparing",
  "on_the_way",
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Orders that belong to the current account. Admins see the whole workspace,
 * signed-in customers only see their own orders, and guests see nothing.
 */
export function getOrdersForUser(orders: Order[], user: AuthUser | null) {
  if (!user) return [];
  if (user.role === "admin") return orders;

  return orders.filter((order) => {
    if (order.userId) return order.userId === user.id;
    return normalizeEmail(order.userEmail) === normalizeEmail(user.email);
  });
}

export function countActiveOrders(orders: Order[]) {
  return orders.filter((order) =>
    ACTIVE_ORDER_STATUSES.includes(order.status),
  ).length;
}
