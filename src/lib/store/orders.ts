import { create } from "zustand";
import type { Order, OrderStatus } from "@/lib/types";
import {
  fetchOrders,
  createOrderRemote,
  updateOrderStatusRemote,
  advanceOrderStatusRemote,
} from "@/lib/db/orders";
import { useAuthStore } from "@/lib/store/auth";

type OrdersState = {
  orders: Order[];
  loaded: boolean;
  loading: boolean;
  hydrate: () => Promise<void>;
  addOrder: (order: Order) => Promise<boolean>;
  updateStatus: (id: string, status: OrderStatus) => Promise<boolean>;
  advanceStatus: (id: string) => Promise<OrderStatus | null>;
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending_payment: "confirmed",
  confirmed: "preparing",
  preparing: "on_the_way",
  on_the_way: "delivered",
};

/** The forward transition an admin can apply to an order. */
export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[status] ?? null;
}

/** Time to spend in each status before the delivery simulation advances. */
export const AUTO_ADVANCE_MS: Partial<Record<OrderStatus, number>> = {
  confirmed: 5_000,
  preparing: 10_000,
  on_the_way: 20_000,
};

const advancing = new Set<string>();

function nextPaymentStatus(
  order: Order,
  status: OrderStatus,
): Order["paymentStatus"] {
  if (status === "cancelled") {
    return order.paymentStatus === "paid" ? "refunded" : order.paymentStatus;
  }
  if (status === "delivered" && order.paymentMethod === "cod") {
    return "paid";
  }
  return order.paymentStatus;
}

export const useOrdersStore = create<OrdersState>()((set, get) => ({
  orders: [],
  loaded: false,
  loading: false,

  hydrate: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ orders: [], loaded: true, loading: false });
      return;
    }

    set({ loading: true });
    const data = await fetchOrders();
    set({ orders: data, loaded: true, loading: false });
  },

  addOrder: async (order) => {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    const saved = await createOrderRemote(order, user.id);
    if (!saved) return false;

    set({ orders: [order, ...get().orders] });
    return true;
  },

  updateStatus: async (id, status) => {
    const order = get().orders.find((item) => item.id === id);
    if (!order) return false;

    const alreadyLogged = order.events.some((event) => event.status === status);
    const events = alreadyLogged
      ? order.events
      : [...order.events, { status, at: new Date().toISOString() }];
    const paymentStatus = nextPaymentStatus(order, status);
    const autoAdvance =
      status === "delivered" || status === "cancelled"
        ? false
        : order.autoAdvance;

    const saved = await updateOrderStatusRemote(id, status, {
      paymentStatus,
      events,
      autoAdvance,
    });
    if (!saved) return false;

    set({
      orders: get().orders.map((item) =>
        item.id === id
          ? { ...item, status, events, paymentStatus, autoAdvance }
          : item,
      ),
    });
    return true;
  },

  advanceStatus: async (id) => {
    if (advancing.has(id)) return null;

    const order = get().orders.find((item) => item.id === id);
    if (!order) return null;

    const next = NEXT_STATUS[order.status];
    if (!next) return null;

    advancing.add(id);
    try {
      const serverStatus = await advanceOrderStatusRemote(id);
      if (!serverStatus) return null;

      const events = order.events.some((event) => event.status === serverStatus)
        ? order.events
        : [...order.events, { status: serverStatus, at: new Date().toISOString() }];
      const paymentStatus = nextPaymentStatus(order, serverStatus);
      const autoAdvance =
        serverStatus === "delivered" || serverStatus === "cancelled"
          ? false
          : order.autoAdvance;

      set({
        orders: get().orders.map((item) =>
          item.id === id
            ? {
                ...item,
                status: serverStatus,
                events,
                paymentStatus,
                autoAdvance,
              }
            : item,
        ),
      });
      return serverStatus;
    } finally {
      advancing.delete(id);
    }
  },
}));
