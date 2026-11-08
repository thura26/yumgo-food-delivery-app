import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock3,
  PackageCheck,
  ReceiptText,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { OrderCard } from "@/components/order-card";
import { EmptyState } from "@/components/empty-state";
import { PillTabs } from "@/components/ui/tabs";
import { useMounted } from "@/components/providers";
import { useOrdersStore } from "@/lib/store/orders";
import { useCartUiStore, type CartEntry } from "@/lib/store/cart-ui";
import { useAuthStore } from "@/lib/store/auth";
import { useCatalog } from "@/lib/use-catalog";
import { getOrdersForUser } from "@/lib/user-orders";
import type { Order, OrderStatus } from "@/lib/types";
import { formatMMK } from "@/lib/utils";

type Tab = "all" | "processing" | "completed" | "cancelled";

const processingStatuses: OrderStatus[] = ["confirmed", "preparing", "on_the_way"];

export default function OrdersPage() {
  const navigate = useNavigate();
  const mounted = useMounted();
  const catalog = useCatalog();
  const orders = useOrdersStore((state) => state.orders);
  const hydrateOrders = useOrdersStore((state) => state.hydrate);
  const requestAddMany = useCartUiStore((state) => state.requestAddMany);
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    if (user) void hydrateOrders();
  }, [user, hydrateOrders]);

  function reorder(order: Order) {
    const restaurant = catalog.find((item) => item.id === order.restaurantId);
    if (!restaurant) {
      toast.error("This restaurant is no longer available.");
      return;
    }

    const menuItems = restaurant.categories.flatMap(
      (category) => category.items,
    );
    const entries: CartEntry[] = [];

    for (const line of order.items) {
      const menuItem = menuItems.find(
        (item) => item.id === line.itemId && item.isAvailable !== false,
      );
      if (menuItem) {
        entries.push({ item: menuItem, qty: line.qty });
      }
    }

    if (entries.length === 0) {
      toast.error("Those dishes are unavailable right now.");
      return;
    }

    const result = requestAddMany(restaurant, entries);
    if (result === "added") {
      toast.success("Items added back to your cart");
      navigate("/cart");
    }
  }

  const myOrders = useMemo(
    () => getOrdersForUser(orders, user),
    [orders, user],
  );

  const counts = useMemo(
    () => ({
      all: myOrders.length,
      processing: myOrders.filter((order) =>
        processingStatuses.includes(order.status),
      ).length,
      completed: myOrders.filter((order) => order.status === "delivered").length,
      cancelled: myOrders.filter((order) => order.status === "cancelled").length,
    }),
    [myOrders],
  );

  const filtered = useMemo(() => {
    if (tab === "processing")
      return myOrders.filter((order) => processingStatuses.includes(order.status));
    if (tab === "completed")
      return myOrders.filter((order) => order.status === "delivered");
    if (tab === "cancelled")
      return myOrders.filter((order) => order.status === "cancelled");
    return myOrders;
  }, [myOrders, tab]);

  const spent = myOrders
    .filter((order) => order.status === "delivered")
    .reduce((sum, order) => sum + order.total, 0);

  if (!mounted) {
    return (
      <div className="px-4 py-6">
        <div className="skeleton h-8 w-40 rounded-full" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="skeleton h-24 rounded-3xl" />
          <div className="skeleton h-24 rounded-3xl" />
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-28 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader
        title="My orders"
        subtitle="Track, reorder and revisit your favourites."
        right={
          <Link
            to="/restaurants"
            className="flex h-10 items-center gap-1 rounded-full border border-line bg-white px-3 text-[11px] font-bold text-brand transition hover:border-brand/30"
          >
            <Sparkles size={14} /> Order
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-white p-3.5 shadow-card">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
              <ClipboardList size={15} />
            </span>
            <p className="mt-2 text-xl font-extrabold tracking-tight">
              {counts.all}
            </p>
            <p className="text-[10px] text-muted">Total orders</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-3.5 shadow-card">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={15} />
            </span>
            <p className="mt-2 text-xl font-extrabold tracking-tight">
              {counts.processing}
            </p>
            <p className="text-[10px] text-muted">In progress</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-3.5 shadow-card">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <PackageCheck size={15} />
            </span>
            <p className="mt-2 text-xl font-extrabold tracking-tight">
              {counts.completed}
            </p>
            <p className="text-[10px] text-muted">Delivered</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-3.5 shadow-card">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <ReceiptText size={15} />
            </span>
            <p className="mt-2 text-xl font-extrabold tracking-tight">
              {formatMMK(spent)}
            </p>
            <p className="text-[10px] text-muted">Total spent</p>
          </div>
        </div>

        <div className="mt-4">
          <PillTabs
            tabs={[
              { value: "all", label: "All", count: counts.all },
              { value: "processing", label: "Processing", count: counts.processing },
              { value: "completed", label: "Completed", count: counts.completed },
              { value: "cancelled", label: "Cancelled", count: counts.cancelled },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        <div className="mt-3 space-y-2.5">
          {filtered.length ? (
            filtered.map((order) => (
              <OrderCard key={order.id} order={order} onReorder={reorder} />
            ))
          ) : (
            <EmptyState
              icon={
                tab === "cancelled" ? (
                  <XCircle size={26} />
                ) : tab === "completed" ? (
                  <PackageCheck size={26} />
                ) : (
                  <ClipboardList size={26} />
                )
              }
              title={
                tab === "all"
                  ? "No orders yet"
                  : `No ${tab === "processing" ? "active" : tab} orders`
              }
              description={
                tab === "all"
                  ? "Your order history will appear here once you place your first order."
                  : "Try another tab or explore nearby restaurants to place a new order."
              }
              actionLabel="Browse restaurants"
              actionHref="/restaurants"
            />
          )}
        </div>
      </div>
    </div>
  );
}
