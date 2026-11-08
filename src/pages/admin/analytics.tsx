import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bike,
  CreditCard,
  Download,
  MapPin,
  PackageCheck,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCard, StatCard } from "@/components/admin/ui";
import {
  OrdersBarChart,
  RevenueAreaChart,
  StatusDonut,
} from "@/components/admin/charts";
import { cn, formatMMK, PAYMENT_LABEL, formatDate } from "@/lib/utils";
import {
  formatCompactMMK,
  hourlyBreakdown,
  orderSummary,
  paymentBreakdown,
  periodComparison,
  revenueByDay,
  statusBreakdown,
  topRestaurants,
} from "@/lib/analytics";
import { useMounted } from "@/components/providers";
import { useOrdersStore } from "@/lib/store/orders";
import { useCatalog } from "@/lib/use-catalog";

type Range = 7 | 14 | 30;

const paymentColors = {
  cod: "#2F9E63",
};

type Trend = { value: string; positive: boolean } | undefined;

function percentTrend(current: number, previous: number): Trend {
  if (previous > 0) {
    const change = Math.round(((current - previous) / previous) * 1000) / 10;
    return {
      value: `${change > 0 ? "+" : ""}${change}%`,
      positive: change >= 0,
    };
  }
  if (current > 0) return { value: "New", positive: true };
  return { value: "0%", positive: true };
}

function pointTrend(
  current: number,
  currentOrders: number,
  previous: number,
  previousOrders: number,
): Trend {
  if (!currentOrders && !previousOrders) {
    return { value: "0 pts", positive: true };
  }
  const change = Math.round((current - previous) * 10) / 10;
  return {
    value: `${change > 0 ? "+" : ""}${change} pts`,
    positive: change <= 0,
  };
}

export default function AdminAnalyticsPage() {
  const mounted = useMounted();
  const orders = useOrdersStore((state) => state.orders);
  const catalog = useCatalog();
  const [range, setRange] = useState<Range>(7);

  const series = useMemo(() => revenueByDay(orders, range), [orders, range]);
  const summary = useMemo(() => orderSummary(orders), [orders]);
  const statuses = statusBreakdown(orders);
  const payments = paymentBreakdown(orders);
  const top = topRestaurants(orders, 5);
  const hourly = hourlyBreakdown(orders);

  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; email: string; orders: number; spent: number }>();
    orders.forEach((order) => {
      if (order.status === "cancelled") return;
      const current = map.get(order.userEmail) ?? {
        name: order.customerName,
        email: order.userEmail,
        orders: 0,
        spent: 0,
      };
      current.orders += 1;
      current.spent += order.total;
      map.set(order.userEmail, current);
    });
    return Array.from(map.values())
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
  }, [orders]);

  const insights = useMemo(() => {
    const delivered = orders.filter((order) => order.status === "delivered");
    const durations = delivered
      .map((order) => {
        const done = order.events.find((event) => event.status === "delivered");
        if (!done) return null;
        const minutes =
          (new Date(done.at).getTime() - new Date(order.placedAt).getTime()) /
          60_000;
        return minutes > 0 ? minutes : null;
      })
      .filter((value): value is number => value !== null);
    const averageDelivery = durations.length
      ? Math.round(
          durations.reduce((sum, value) => sum + value, 0) / durations.length,
        )
      : null;

    const validOrders = orders.filter((order) => order.status !== "cancelled");
    const perCustomer = new Map<string, number>();
    validOrders.forEach((order) => {
      const key = order.userId ?? order.userEmail;
      perCustomer.set(key, (perCustomer.get(key) ?? 0) + 1);
    });
    const customers = perCustomer.size;
    const repeatCustomers = [...perCustomer.values()].filter(
      (count) => count >= 2,
    ).length;
    const repeatRate = customers
      ? Math.round((repeatCustomers / customers) * 100)
      : null;

    const townships = new Map<string, number>();
    validOrders.forEach((order) => {
      if (!order.restaurantTownship) return;
      townships.set(
        order.restaurantTownship,
        (townships.get(order.restaurantTownship) ?? 0) + 1,
      );
    });
    const topTownship = [...townships.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];

    return {
      averageDelivery:
        averageDelivery !== null ? `${averageDelivery} min` : "—",
      repeatRate: repeatRate !== null ? `${repeatRate}%` : "—",
      topTownship: topTownship?.[0] ?? "—",
    };
  }, [orders]);

  const totalPayments = Object.values(payments).reduce((sum, value) => sum + value, 0);
  const rangeRevenue = series.reduce((sum, point) => sum + point.revenue, 0);
  const rangeOrders = series.reduce((sum, point) => sum + point.orders, 0);
  const comparison = useMemo(
    () => periodComparison(orders, range),
    [orders, range],
  );
  const revenueTrend = percentTrend(
    comparison.current.revenue,
    comparison.previous.revenue,
  );
  const averageTrend = percentTrend(
    comparison.current.averageOrder,
    comparison.previous.averageOrder,
  );
  const orderTrend = percentTrend(
    comparison.current.orders,
    comparison.previous.orders,
  );
  const cancelTrend = pointTrend(
    comparison.current.cancelRate,
    comparison.current.orders,
    comparison.previous.cancelRate,
    comparison.previous.orders,
  );

  const statusData = [
    { name: "Delivered", value: statuses.delivered, color: "#2F9E63" },
    { name: "On the way", value: statuses.on_the_way, color: "#6366F1" },
    { name: "Preparing", value: statuses.preparing, color: "#F4B740" },
    { name: "Confirmed", value: statuses.confirmed, color: "#3B82F6" },
    { name: "Cancelled", value: statuses.cancelled, color: "#F43F5E" },
  ].filter((item) => item.value > 0);

  const exportReport = () => {
    const rows = [
      ["YumGo analytics report", formatDate(new Date())],
      ["Metric", "Value"],
      ["Total revenue", String(summary.revenue)],
      ["Delivered orders", String(summary.delivered)],
      ["Average order value", String(summary.averageOrder)],
      ["Cancellation rate", `${summary.cancelRate}%`],
      ["Unique customers", String(summary.uniqueCustomers)],
      [],
      ["Day", "Revenue", "Orders"],
      ...series.map((point) => [
        point.label,
        String(point.revenue),
        String(point.orders),
      ]),
      [],
      ["Restaurant", "Orders", "Revenue"],
      ...top.map((item) => [item.name, String(item.orders), String(item.revenue)]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `yumgo-analytics-${range}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics report exported");
  };

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-20 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton h-28 rounded-3xl" />
          ))}
        </div>
        <div className="skeleton h-80 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand">
            Performance
          </p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight sm:text-xl">
            {formatCompactMMK(rangeRevenue)} across the last {range} days
          </h2>
          <p className="mt-0.5 text-[10px] text-muted">
            {rangeOrders} orders · {summary.uniqueCustomers} unique customers ·{" "}
            {summary.cancelRate}% cancellation rate
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-line bg-cream/60 p-1">
            {([7, 14, 30] as Range[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[10px] font-bold transition",
                  range === value
                    ? "bg-ink text-white shadow-sm"
                    : "text-muted hover:text-ink",
                )}
              >
                {value} days
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportReport}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-line bg-white px-3.5 text-[10px] font-bold text-ink transition hover:border-brand/30"
          >
            <Download size={12} /> Export
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <StatCard
          label="Lifetime revenue"
          value={formatMMK(summary.revenue)}
          hint={`${summary.delivered} delivered orders`}
          icon={<Wallet size={17} />}
          trend={revenueTrend}
        />
        <StatCard
          label="Avg. order value"
          value={formatMMK(summary.averageOrder)}
          hint="Delivered orders only"
          icon={<CreditCard size={17} />}
          tone="blue"
          trend={averageTrend}
        />
        <StatCard
          label="Order volume"
          value={summary.total.toLocaleString()}
          hint={`${summary.active} currently active`}
          icon={<ReceiptText size={17} />}
          tone="violet"
          trend={orderTrend}
        />
        <StatCard
          label="Cancellation rate"
          value={`${summary.cancelRate}%`}
          hint={`${summary.cancelled} cancelled orders`}
          icon={<PackageCheck size={17} />}
          tone="amber"
          trend={cancelTrend}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <AdminCard
          title="Revenue trend"
          subtitle={`Daily revenue over the last ${range} days`}
          action={
            revenueTrend ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
                  revenueTrend.positive
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600",
                )}
              >
                {revenueTrend.positive ? (
                  <TrendingUp size={10} />
                ) : (
                  <TrendingDown size={10} />
                )}
                {revenueTrend.value}
              </span>
            ) : (
              <span className="rounded-full bg-cream px-2 py-0.5 text-[9px] font-bold text-muted">
                No prior period
              </span>
            )
          }
        >
          <RevenueAreaChart data={series} height={240} />
        </AdminCard>

        <AdminCard
          title="Order volume"
          subtitle="Orders placed per day"
          action={
            <span className="rounded-full bg-cream px-2 py-0.5 text-[9px] font-bold text-muted">
              {rangeOrders} orders
            </span>
          }
        >
          <OrdersBarChart data={series} height={240} color="#00B14F" />
        </AdminCard>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <AdminCard title="Status mix" subtitle="Where orders currently sit">
          <StatusDonut data={statusData} height={190} />
          <div className="mt-2 space-y-1.5">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-[10px]">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-muted">{item.name}</span>
                <span className="ml-auto font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="Payment mix" subtitle="Orders by payment method">
          <div className="space-y-3 py-1">
            {(Object.keys(payments) as (keyof typeof payments)[]).map((method) => {
              const value = payments[method];
              const percent = totalPayments
                ? Math.round((value / totalPayments) * 100)
                : 0;
              return (
                <div key={method}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: paymentColors[method] }}
                      />
                      {PAYMENT_LABEL[method]}
                    </span>
                    <span className="font-bold">{percent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percent}%`,
                        background: paymentColors[method],
                      }}
                    />
                  </div>
                  <p className="mt-0.5 text-[9px] text-muted">
                    {value} orders
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-2 rounded-xl bg-cream/70 p-2.5 text-[9px] leading-relaxed text-muted">
            Cash on delivery is the payment method for every order.
          </div>
        </AdminCard>

        <AdminCard title="Peak hours" subtitle="Orders by time of day">
          <OrdersBarChart data={hourly} height={190} color="#171717" />
          <p className="mt-1 text-center text-[9px] text-muted">
            Lunch and dinner service drive the highest volume.
          </p>
        </AdminCard>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <AdminCard
          title="Top restaurants"
          subtitle="Ranked by revenue from delivered orders"
          action={
            <span className="text-[9px] font-semibold text-muted">
              {catalog.length} partners
            </span>
          }
          bodyClassName="space-y-3 p-4 sm:p-5"
        >
          {top.map((item, index) => (
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
                  {item.orders} orders · avg {formatMMK(item.revenue / item.orders)}
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
          ))}
        </AdminCard>

        <AdminCard
          title="Top customers"
          subtitle="Most valuable customers by lifetime spend"
          action={
            <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-[9px] font-bold text-muted">
              <Users size={10} /> {summary.uniqueCustomers} total
            </span>
          }
          bodyClassName="space-y-1 p-4 sm:p-5"
        >
          {topCustomers.map((customer, index) => (
            <div
              key={customer.email}
              className="flex items-center gap-3 rounded-xl px-1.5 py-2 transition hover:bg-cream/60"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-extrabold text-brand">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold">{customer.name}</p>
                <p className="truncate text-[9px] text-muted">{customer.email}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-extrabold">
                  {formatMMK(customer.spent)}
                </p>
                <p className="text-[9px] text-muted">{customer.orders} orders</p>
              </div>
            </div>
          ))}
        </AdminCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: <Bike size={16} />,
            label: "Avg. delivery time",
            value: insights.averageDelivery,
            hint: "From confirmation to door",
          },
          {
            icon: <ArrowUpRight size={16} />,
            label: "Repeat order rate",
            value: insights.repeatRate,
            hint: "Customers with 2+ orders",
          },
          {
            icon: <MapPin size={16} />,
            label: "Top township",
            value: insights.topTownship,
            hint: "Highest order density",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-card"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
              {item.icon}
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight">{item.value}</p>
              <p className="text-[9px] font-semibold text-muted">{item.label}</p>
              <p className="text-[8px] text-muted/70">{item.hint}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[9px] text-muted/60">
        Analytics computed from {orders.length} orders · last updated{" "}
        {formatDate(new Date())}
      </p>
    </div>
  );
}
