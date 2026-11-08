import { useMemo } from "react";
import { useAdminStore } from "@/lib/store/admin";
import { useOrdersStore } from "@/lib/store/orders";
import { useCatalog } from "@/lib/use-catalog";

export type AdminNotification = {
  id: string;
  kind: "order" | "review" | "stock" | "setup";
  title: string;
  description: string;
  href: string;
  at?: string;
  tone: "brand" | "amber" | "violet" | "rose";
};

export function useAdminNotifications() {
  const orders = useOrdersStore((s) => s.orders);
  const reviews = useAdminStore((s) => s.reviews);
  const catalog = useCatalog();
  const readIds = useAdminStore((s) => s.readNotificationIds);
  const markNotificationsRead = useAdminStore((s) => s.markNotificationsRead);

  const notifications = useMemo<AdminNotification[]>(() => {
    const list: AdminNotification[] = [];

    for (const order of orders) {
      if (order.status === "pending_payment") {
        list.push({
          id: `order-${order.id}-${order.status}`,
          kind: "order",
          title: `Payment pending · ${order.code}`,
          description: `${order.customerName} · ${order.restaurantName}`,
          href: "/admin/orders",
          at: order.placedAt,
          tone: "amber",
        });
      } else if (order.status === "confirmed") {
        list.push({
          id: `order-${order.id}-${order.status}`,
          kind: "order",
          title: `New order · ${order.code}`,
          description: `${order.customerName} · ${order.restaurantName}`,
          href: "/admin/orders",
          at: order.placedAt,
          tone: "brand",
        });
      }
    }

    for (const review of reviews) {
      if (!review.isApproved) {
        const rest = catalog.find((r) => r.id === review.restaurantId);
        list.push({
          id: `review-${review.id}`,
          kind: "review",
          title: `${review.rating}★ review awaiting approval`,
          description: `${review.userName}${rest ? ` · ${rest.name}` : ""}`,
          href: "/admin/reviews",
          at: review.date,
          tone: "violet",
        });
      }
    }

    for (const r of catalog) {
      for (const c of r.categories) {
        for (const item of c.items) {
          if (item.isAvailable === false) {
            list.push({
              id: `stock-${item.id}`,
              kind: "stock",
              title: `${item.name} is sold out`,
              description: r.name,
              href: "/admin/restaurants",
              tone: "rose",
            });
          }
        }
      }
      if (r.categories.length === 0) {
        list.push({
          id: `setup-${r.id}`,
          kind: "setup",
          title: `Add a menu to ${r.name}`,
          description: "This restaurant has no menu items yet.",
          href: "/admin/restaurants",
          tone: "brand",
        });
      }
    }

    return list;
  }, [orders, reviews, catalog]);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const markAllRead = () => {
    markNotificationsRead(notifications.map((n) => n.id));
  };

  const markRead = (ids: string[]) => {
    markNotificationsRead(ids);
  };

  return { notifications, unreadCount, markAllRead, markRead };
}