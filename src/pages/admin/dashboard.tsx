import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  Bike,
  CalendarDays,
  ChefHat,
  ChevronRight,
  ClipboardList,
  Clock3,
  CreditCard,
  PackageCheck,
  Plus,
  ReceiptText,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCard, StatCard } from "@/components/admin/ui";
import { RevenueAreaChart, StatusDonut } from "@/components/admin/charts";
import { StatusPill } from "@/components/order-card";
import { useMounted } from "@/components/providers";
import { useAuthStore } from "@/lib/store/auth";
import {
  getNextOrderStatus,
  useOrdersStore,
} from "@/lib/store/orders";
import { useAdminStore } from "@/lib/store/admin";
import {
  formatCompactMMK,
  orderSummary,
  revenueByDay,
  statusBreakdown,
  topRestaurants,
} from "@/lib/analytics";
import { formatMMK, formatTime, STATUS_META } from "@/lib/utils";
import { useCatalog } from "@/lib/use-catalog";

const ACTIVE = ["confirmed", "preparing", "on_the_way"];

export default function AdminDashboardPage() {
  const mounted = useMounted();
  const user = useAuthStore((state) => state.user);
  const orders = useOrdersStore((state) => state.orders);
  const updateStatus = useOrdersStore((state) => state.updateStatus);
  const promotions = useAdminStore((state) => state.promotions);
  const reviews = useAdminStore((state) => state.reviews);
  const users = useAdminStore((state) => state.users);
  const catalog = useCatalog();

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-36 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton h-28 rounded-3xl" />
          ))}
        </div>
        <div className="skeleton h-72 rounded-3xl" />
      </div>
    );
  }

  const summary = orderSummary(orders);
  const revenue = revenueByDay(orders, 7);
  const statuses = statusBreakdown(orders);
  const live = orders.filter((order) => ACTIVE.includes(order.status)).slice(0, 5);
  const recent = orders.slice(0, 6);
  const top = topRestaurants(orders, 4);
  const pendingReviews = reviews.filter((review) => !review.isApproved).length;
  const activePromos = promotions.filter((promo) => promo.isActive).length;

  const statusData = [
    { name: "Delivered", value: statuses.delivered, color: "#2F9E63" },
    { name: "On the way", value: statuses.on_the_way, color: "#6366F1" },
    { name: "Preparing", value: statuses.preparing, color: "#F4B740" },
    { name: "Confirmed", value: statuses.confirmed, color: "#3B82F6" },
    { name: "Cancelled", value: statuses.cancelled, color: "#F43F5E" },
  ].filter((item) => item.value > 0);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const quickActions = [
    {
      href: "/admin/orders",
      icon: <ClipboardList size={17} />,
      label: "Review live orders",
      hint: `${summary.active} active now`,
    },
    {
      href: "/admin/promotions",
      icon: <BadgePercent size={17} />,
      label: "Create a promotion",
      hint: `${activePromos} active codes`,
    },
    {
      href: "/admin/reviews",
      icon: <ChefHat size={17} />,
      label: "Moderate reviews",
      hint: `${pendingReviews} pending`,
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="relative overflow-hidden rounded-[30px] bg-ink p-5 text-white shadow-soft sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-brand/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/70 backdrop-blur">
              <CalendarDays size={11} /> {today}
            </p>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-[-0.04em] sm:text-3xl">
              Welcome back, {user?.name?.split(" ")[0] ?? "Admin"}.
            </h2>
            <p className="mt-1.5 max-w-md text-[11px] leading-relaxed text-white/55 sm:text-xs">
              You have {summary.active} deliveries in progress and{" "}
              {pendingReviews} review{pendingReviews === 1 ? "" : "s"} waiting for
              approval. Here is how YumGo is doing today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/orders"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-[11px] font-bold text-white transition hover:bg-brand-dark"
            >
              <ClipboardList size={14} /> Manage orders
            </Link>
            <Link
              to="/admin/analytics"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 text-[11px] font-bold text-white/90 backdrop-blur transition hover:bg-white/10"
            >
              <TrendingUp size={14} /> View analytics
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={formatMMK(summary.todayRevenue)}
          hint={`${summary.todayOrders} orders placed today`}
          icon={<Wallet size={17} />}
        />
        <StatCard
          label="Total orders"
          value={summary.total.toLocaleString()}
          hint={`${summary.delivered} delivered overall`}
          icon={<ReceiptText size={17} />}
          tone="blue"
        />
        <StatCard
          label="Live deliveries"
          value={String(summary.active)}
          hint="Confirmed, preparing or on the way"
          icon={<Bike size={17} />}
          tone="violet"
        />
        <StatCard
          label="Avg. order value"
          value={formatMMK(summary.averageOrder)}
          hint={`${summary.cancelRate}% cancellation rate`}
          icon={<CreditCard size={17} />}
          tone="amber"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.55fr_1fr]">
        <AdminCard
          title="Revenue this week"
          subtitle="Delivered and in-progress orders, excluding cancellations"
          action={
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">
              {formatCompactMMK(revenue.reduce((sum, point) => sum + point.revenue, 0))}
            </span>
          }
        >
          <RevenueAreaChart data={revenue} height={226} />
        </AdminCard>

        <AdminCard
          title="Order status"
          subtitle="Across all current orders"
          action={
            <Link
              to="/admin/orders"
              className="text-[10px] font-bold text-brand"
            >
              View all
            </Link>
          }
        >
          <StatusDonut data={statusData} height={196} />
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {statusData.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5 rounded-xl bg-cream/70 px-2 py-1.5"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-[9px] font-semibold text-muted">
                  {item.name}
                </span>
                <span className="ml-auto text-[9px] font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.55fr_1fr]">
        <AdminCard
          title="Recent orders"
          subtitle="The latest activity from your customers"
          action={
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-brand"
            >
              All orders <ChevronRight size={12} />
            </Link>
          }
          bodyClassName="p-0 sm:p-0"
        >
          <div className="divide-y divide-line/70 lg:hidden">
            {recent.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                to="/admin/orders"
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-cream/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold">{order.code}</p>
                  <p className="mt-0.5 truncate text-[9px] text-muted">
                    {order.customerName} · {order.restaurantName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-extrabold">
                    {formatMMK(order.total)}
                  </p>
                  <StatusPill status={order.status} className="mt-1" />
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                  <th className="px-4 py-2.5">Order</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Restaurant</th>
                  <th className="px-4 py-2.5">Total</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-line/60 text-[11px] transition last:border-0 hover:bg-cream/50"
                  >
                    <td className="px-4 py-2.5 font-bold">{order.code}</td>
                    <td className="px-4 py-2.5 text-muted">{order.customerName}</td>
                    <td className="px-4 py-2.5 text-muted">
                      {order.restaurantName}
                    </td>
                    <td className="px-4 py-2.5 font-semibold">
                      {formatMMK(order.total)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={order.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right text-[10px] text-muted">
                      {formatTime(order.placedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <AdminCard
          title="Live deliveries"
          subtitle="Orders currently moving"
          action={
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[9px] font-bold text-brand">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              {live.length} live
            </span>
          }
          bodyClassName="space-y-2 p-4 sm:p-4"
        >
          {live.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-cream/50 p-5 text-center">
              <Bike size={20} className="mx-auto text-muted/60" />
              <p className="mt-2 text-[11px] font-bold">No active deliveries</p>
              <p className="mt-0.5 text-[9px] text-muted">
                New orders will appear here as they come in.
              </p>
            </div>
          )}
          {live.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-line bg-cream/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold">
                    {order.restaurantName}
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted">
                    {order.code} · {order.customerName}
                  </p>
                </div>
                <StatusPill status={order.status} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[9px] text-muted">
                  <Clock3 size={10} /> {formatTime(order.placedAt)}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const next = getNextOrderStatus(order.status);
                    if (!next) {
                      toast("This order has no next status.");
                      return;
                    }
                    const ok = await updateStatus(order.id, next);
                    if (ok) {
                      toast.success(
                        `${order.code} moved to ${STATUS_META[next].label}`,
                      );
                    } else {
                      toast.error("Could not update the order.");
                    }
                  }}
                  className="inline-flex h-7 items-center gap-1 rounded-full bg-ink px-2.5 text-[9px] font-bold text-white transition hover:bg-black"
                >
                  Advance <ArrowRight size={11} />
                </button>
              </div>
            </div>
          ))}
        </AdminCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.1fr]">
        <AdminCard
          title="Top restaurants"
          subtitle="Ranked by revenue from delivered orders"
          action={
            <Link
              to="/admin/restaurants"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-brand"
            >
              Manage <ChevronRight size={12} />
            </Link>
          }
          bodyClassName="space-y-3 p-4 sm:p-5"
        >
          {top.map((item, index) => {
            const restaurant = catalog.find((entry) => entry.id === item.id);
            return (
              <div key={item.id} className="flex items-center gap-3">
                <span className="w-3 text-[10px] font-extrabold text-muted/70">
                  {index + 1}
                </span>
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-9 w-9 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold">{item.name}</p>
                  <p className="mt-0.5 text-[9px] text-muted">
                    {item.orders} orders
                    {restaurant ? ` · ★ ${restaurant.rating}` : ""}
                  </p>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{
                        width: `${
                          top[0] ? Math.round((item.revenue / top[0].revenue) * 100) : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-extrabold">
                  {formatCompactMMK(item.revenue)}
                </span>
              </div>
            );
          })}
        </AdminCard>

        <div className="grid gap-3 sm:grid-cols-2">
          <AdminCard title="Quick actions" bodyClassName="space-y-2 p-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className="flex items-center gap-2.5 rounded-2xl border border-line px-3 py-2.5 transition hover:border-brand/30 hover:bg-cream/60"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                  {action.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold">{action.label}</span>
                  <span className="block text-[9px] text-muted">{action.hint}</span>
                </span>
                <ArrowUpRight size={13} className="text-muted" />
              </Link>
            ))}
          </AdminCard>

          <AdminCard title="At a glance" bodyClassName="p-4">
            <div className="space-y-2.5">
              {[
                {
                  icon: <Users size={14} />,
                  label: "Registered users",
                  value: users.length.toLocaleString(),
                  tone: "bg-blue-50 text-blue-600",
                },
                {
                  icon: <Store size={14} />,
                  label: "Partner restaurants",
                  value: catalog.length.toLocaleString(),
                  tone: "bg-brand-soft text-brand-dark",
                },
                {
                  icon: <BadgePercent size={14} />,
                  label: "Active promotions",
                  value: activePromos.toLocaleString(),
                  tone: "bg-emerald-50 text-emerald-600",
                },
                {
                  icon: <ChefHat size={14} />,
                  label: "Pending reviews",
                  value: pendingReviews.toLocaleString(),
                  tone: "bg-amber-50 text-amber-600",
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${row.tone}`}
                  >
                    {row.icon}
                  </span>
                  <span className="flex-1 text-[10px] text-muted">{row.label}</span>
                  <span className="text-[11px] font-extrabold">{row.value}</span>
                </div>
              ))}
            </div>
            <Link
              to="/admin/analytics"
              className="mt-3 flex h-8 items-center justify-center gap-1 rounded-full bg-ink text-[9px] font-bold text-white transition hover:bg-black"
            >
              Open full analytics <ArrowRight size={11} />
            </Link>
          </AdminCard>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-line bg-white/70 px-4 py-3 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <PackageCheck size={13} className="text-emerald-500" />
          {summary.delivered} deliveries completed in this dataset
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Plus size={13} className="text-brand" />
          Tip: changes made here update the customer app instantly.
        </span>
      </div>
    </div>
  );
}
