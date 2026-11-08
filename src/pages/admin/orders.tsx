import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bike,
  ChevronRight,
  Download,
  MapPin,
  PackageCheck,
  Search,
  ShoppingBag,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/ui";
import { StatusPill } from "@/components/order-card";
import { Modal } from "@/components/ui/modal";
import { PillTabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/components/providers";
import {
  getNextOrderStatus,
  useOrdersStore,
} from "@/lib/store/orders";
import type { Order, OrderStatus } from "@/lib/types";
import {
  cn,
  formatDate,
  formatMMK,
  formatTime,
  PAYMENT_LABEL,
  STATUS_META,
} from "@/lib/utils";

type Filter = "all" | "active" | "delivered" | "cancelled" | "pending_payment";

const activeStatuses: OrderStatus[] = ["confirmed", "preparing", "on_the_way"];

export default function AdminOrdersPage() {
  const mounted = useMounted();
  const orders = useOrdersStore((state) => state.orders);
  const updateStatus = useOrdersStore((state) => state.updateStatus);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const counts = useMemo(
    () => ({
      all: orders.length,
      active: orders.filter((order) => activeStatuses.includes(order.status)).length,
      delivered: orders.filter((order) => order.status === "delivered").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
      pending_payment: orders.filter((order) => order.status === "pending_payment")
        .length,
    }),
    [orders],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "active"
            ? activeStatuses.includes(order.status)
            : order.status === filter;
      const matchesQuery =
        !q ||
        order.code.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q) ||
        order.restaurantName.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [orders, filter, query]);

  const revenue = filtered
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  const exportCsv = () => {
    const rows = [
      [
        "Code",
        "Date",
        "Customer",
        "Phone",
        "Restaurant",
        "Items",
        "Subtotal",
        "Delivery",
        "Discount",
        "Total",
        "Payment",
        "Status",
      ],
      ...filtered.map((order) => [
        order.code,
        formatDate(order.placedAt, true),
        order.customerName,
        order.customerPhone,
        order.restaurantName,
        order.items.reduce((sum, item) => sum + item.qty, 0).toString(),
        String(order.subtotal),
        String(order.deliveryFee),
        String(order.discount),
        String(order.total),
        PAYMENT_LABEL[order.paymentMethod],
        STATUS_META[order.status].label,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `yumgo-orders-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Orders exported as CSV");
  };

  const advance = async (order: Order) => {
    const next = getNextOrderStatus(order.status);
    if (!next) {
      toast("This order has no next status.");
      return;
    }

    const ok = await updateStatus(order.id, next);
    if (!ok) {
      toast.error("Could not update the order. Please try again.");
      return;
    }

    toast.success(`${order.code} → ${STATUS_META[next].label}`);
    setSelected((current) => (current ? { ...current, status: next } : current));
  };

  const cancel = async (order: Order) => {
    const ok = await updateStatus(order.id, "cancelled");
    if (!ok) {
      toast.error("Could not cancel the order. Please try again.");
      return;
    }

    toast.success(`${order.code} cancelled`);
    setSelected((current) =>
      current ? { ...current, status: "cancelled" } : current,
    );
  };

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton h-24 rounded-3xl" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total orders",
            value: counts.all.toLocaleString(),
            icon: <ShoppingBag size={16} />,
            tone: "bg-brand-soft text-brand-dark",
          },
          {
            label: "In progress",
            value: String(counts.active),
            icon: <Bike size={16} />,
            tone: "bg-violet-50 text-violet-600",
          },
          {
            label: "Delivered",
            value: counts.delivered.toLocaleString(),
            icon: <PackageCheck size={16} />,
            tone: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Cancelled",
            value: counts.cancelled.toLocaleString(),
            icon: <XCircle size={16} />,
            tone: "bg-rose-50 text-rose-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-white p-3.5 shadow-card"
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl",
                stat.tone,
              )}
            >
              {stat.icon}
            </span>
            <p className="mt-2 text-xl font-extrabold tracking-tight">{stat.value}</p>
            <p className="text-[9px] font-semibold text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <AdminCard
        title="Order management"
        subtitle={`${filtered.length} orders · ${formatMMK(revenue)} in scope`}
        action={
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-line bg-white px-3 text-[10px] font-bold text-ink transition hover:border-brand/30"
          >
            <Download size={12} /> Export
          </button>
        }
        bodyClassName="p-0 sm:p-0"
      >
        <div className="space-y-3 border-b border-line/70 px-4 py-3 sm:px-5">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-cream/60 px-3">
            <Search size={15} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by code, customer, phone or restaurant..."
              className="h-full w-full bg-transparent text-[11px] outline-none placeholder:text-muted/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted hover:text-ink"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <PillTabs
            size="sm"
            tabs={[
              { value: "all", label: "All", count: counts.all },
              { value: "active", label: "Active", count: counts.active },
              { value: "delivered", label: "Delivered", count: counts.delivered },
              {
                value: "pending_payment",
                label: "Unpaid",
                count: counts.pending_payment,
              },
              { value: "cancelled", label: "Cancelled", count: counts.cancelled },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div className="divide-y divide-line/70 lg:hidden">
          {filtered.slice(0, 30).map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelected(order)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-cream/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[11px] font-bold">{order.code}</p>
                  <StatusPill status={order.status} />
                </div>
                <p className="mt-1 truncate text-[9px] text-muted">
                  {order.customerName} · {order.restaurantName}
                </p>
                <p className="mt-0.5 text-[9px] text-muted">
                  {formatDate(order.placedAt)} · {PAYMENT_LABEL[order.paymentMethod]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-extrabold">{formatMMK(order.total)}</p>
                <ChevronRight size={13} className="ml-auto mt-1 text-muted" />
              </div>
            </button>
          ))}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Restaurant</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-line/60 text-[11px] transition last:border-0 hover:bg-cream/40"
                >
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(order)}
                      className="font-bold text-ink hover:text-brand"
                    >
                      {order.code}
                    </button>
                    <p className="mt-0.5 text-[9px] text-muted">
                      {order.items.reduce((sum, item) => sum + item.qty, 0)} items
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{order.customerName}</p>
                    <p className="mt-0.5 text-[9px] text-muted">
                      {order.customerPhone}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted">{order.restaurantName}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">
                      {PAYMENT_LABEL[order.paymentMethod]}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-[9px] font-semibold",
                        order.paymentStatus === "paid"
                          ? "text-emerald-600"
                          : order.paymentStatus === "refunded"
                            ? "text-rose-500"
                            : "text-amber-600",
                      )}
                    >
                      {order.paymentStatus}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-extrabold">
                    {formatMMK(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-[10px] text-muted">
                    <p>{formatDate(order.placedAt)}</p>
                    <p className="mt-0.5">{formatTime(order.placedAt)}</p>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {activeStatuses.includes(order.status) ? (
                      <button
                        type="button"
                        onClick={() => advance(order)}
                        className="inline-flex h-7 items-center gap-1 rounded-full bg-ink px-2.5 text-[9px] font-bold text-white transition hover:bg-black"
                      >
                        Advance <ArrowRight size={11} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelected(order)}
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-line px-2.5 text-[9px] font-bold text-muted transition hover:border-brand/30 hover:text-brand"
                      >
                        Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-10 text-center">
              <Search size={22} className="mx-auto text-muted/50" />
              <p className="mt-2 text-xs font-bold">No orders match</p>
              <p className="mt-1 text-[10px] text-muted">
                Try a different search or status filter.
              </p>
            </div>
          )}
        </div>
      </AdminCard>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Order ${selected.code}` : "Order"}
        description={
          selected
            ? `${selected.customerName} · ${formatDate(selected.placedAt, true)}`
            : undefined
        }
        className="sm:max-w-2xl"
      >
        {selected && (
          <div className="space-y-4 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={selected.status} />
              <span className="rounded-full bg-cream px-2.5 py-1 text-[9px] font-semibold text-muted">
                {PAYMENT_LABEL[selected.paymentMethod]} · {selected.paymentStatus}
              </span>
              <span className="rounded-full bg-cream px-2.5 py-1 text-[9px] font-semibold text-muted">
                {selected.items.reduce((sum, item) => sum + item.qty, 0)} items
              </span>
            </div>

            <div className="rounded-2xl border border-line bg-cream/50 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-ink">
                <MapPin size={12} className="text-brand" /> Delivery address
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {selected.address}
              </p>
              <p className="mt-1 text-[10px] text-muted">
                {selected.customerPhone} · {selected.userEmail}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                Items
              </p>
              <div className="mt-2 space-y-1.5">
                {selected.items.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="min-w-0 truncate text-muted">
                      {item.qty} × {item.name}
                    </span>
                    <span className="shrink-0 font-semibold">
                      {formatMMK(item.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 border-t border-line pt-3 text-[11px]">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="font-semibold text-ink">
                  {formatMMK(selected.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery fee</span>
                <span className="font-semibold text-ink">
                  {formatMMK(selected.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Service fee</span>
                <span className="font-semibold text-ink">
                  {formatMMK(selected.serviceFee)}
                </span>
              </div>
              {selected.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-semibold">
                    − {formatMMK(selected.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="font-extrabold">Total</span>
                <span className="text-base font-extrabold text-brand">
                  {formatMMK(selected.total)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                Timeline
              </p>
              <div className="mt-2 space-y-2">
                {selected.events.map((event) => (
                  <div
                    key={`${event.status}-${event.at}`}
                    className="flex items-center gap-2 text-[10px]"
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        STATUS_META[event.status].dot,
                      )}
                    />
                    <span className="font-semibold">
                      {STATUS_META[event.status].label}
                    </span>
                    <span className="ml-auto text-muted">
                      {formatTime(event.at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
              {activeStatuses.includes(selected.status) && (
                <Button size="sm" onClick={() => advance(selected)}>
                  Advance status <ArrowRight size={13} />
                </Button>
              )}
              {!["delivered", "cancelled"].includes(selected.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-rose-600"
                  onClick={() => cancel(selected)}
                >
                  <XCircle size={13} /> Cancel order
                </Button>
              )}
              <Link
                to={`/orders/${selected.id}/tracking`}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-line px-4 text-[11px] font-bold text-ink transition hover:border-brand/30"
              >
                Customer tracking <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </Modal>

      <p className="text-center text-[9px] text-muted/60">
        Showing {filtered.length} of {orders.length} orders · updates sync to
        Supabase
      </p>
    </div>
  );
}
