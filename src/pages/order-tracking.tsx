import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  Bike,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/order-card";
import { TrackingMap } from "@/components/maps/map-loaders";
import { Modal } from "@/components/ui/modal";
import { useMounted } from "@/components/providers";
import { AUTO_ADVANCE_MS, useOrdersStore } from "@/lib/store/orders";
import { useCatalog } from "@/lib/use-catalog";
import type { OrderStatus } from "@/lib/types";
import {
  clamp,
  cn,
  formatMMK,
  formatTime,
  PAYMENT_LABEL,
  STATUS_META,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";

const steps: { status: OrderStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { status: "confirmed", label: "Order received", icon: CheckCircle2 },
  { status: "preparing", label: "Being prepared", icon: ChefHat },
  { status: "on_the_way", label: "On the way", icon: Bike },
  { status: "delivered", label: "Delivered", icon: PackageCheck },
];

const arrivalColors = ["#00B14F", "#F4B740", "#2F9E63", "#3B82F6", "#EC4899", "#8B5CF6"];

export default function TrackingPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mounted = useMounted();
  const catalog = useCatalog();
  const orders = useOrdersStore((state) => state.orders);
  const order = orders.find((item) => item.id === params.id);
  const [progress, setProgress] = useState(0);
  const [arrived, setArrived] = useState(false);
  const previousStatus = useRef<OrderStatus | null>(null);
  const onTheWayAt = order?.events.find(
    (event) => event.status === "on_the_way",
  )?.at;

  useEffect(() => {
    if (!order) return;
    if (order.status === "delivered") {
      setProgress(1);
      return;
    }
    if (order.status !== "on_the_way") {
      setProgress(0);
      return;
    }

    // The global order driver (see Providers) advances this order after the
    // same delay, so the rider pin stays in sync even if this page is opened
    // halfway through the trip.
    const startedAt = onTheWayAt ? new Date(onTheWayAt).getTime() : Date.now();
    const deliveryMs = AUTO_ADVANCE_MS.on_the_way ?? 20_000;
    const update = () => {
      setProgress(clamp((Date.now() - startedAt) / deliveryMs, 0, 1));
    };

    update();
    const timer = setInterval(update, 400);
    return () => clearInterval(timer);
  }, [order?.id, order?.status, onTheWayAt]);

  // Celebrate the exact moment the delivery lands while this page is open.
  useEffect(() => {
    if (!order) return;
    const previous = previousStatus.current;
    previousStatus.current = order.status;
    if (previous && previous !== "delivered" && order.status === "delivered") {
      setArrived(true);
    }
  }, [order]);

  const restaurant = order ? catalog.find((r) => r.id === order.restaurantId) : undefined;

  const arrivalConfetti = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        left: `${(index * 41) % 100}%`,
        delay: `${(index % 10) * 0.08}s`,
        duration: `${1.8 + (index % 5) * 0.25}s`,
        color: arrivalColors[index % arrivalColors.length],
        rotate: `${(index * 31) % 360}deg`,
      })),
    [],
  );

  const driverPosition = useMemo(() => {
    if (!order) return { lat: 0, lng: 0 };
    const start = restaurant
      ? { lat: restaurant.lat, lng: restaurant.lng }
      : { lat: order.lat + 0.008, lng: order.lng + 0.008 };
    return {
      lat: start.lat + (order.lat - start.lat) * progress,
      lng: start.lng + (order.lng - start.lng) * progress,
    };
  }, [order, restaurant, progress]);

  if (!mounted) {
    return (
      <div className="px-4 py-6">
        <div className="skeleton h-10 w-44 rounded-full" />
        <div className="mt-4 skeleton h-28 rounded-3xl" />
        <div className="mt-3 skeleton h-64 rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="px-4 py-6">
        <PageHeader title="Track order" />
        <div className="mx-auto mt-6 max-w-xl px-4">
          <EmptyState
            icon={<PackageCheck size={26} />}
            title="Order not found"
            description="We could not find this order on your account. Head back to your orders to continue."
            actionLabel="View my orders"
            actionHref="/orders"
          />
        </div>
      </div>
    );
  }

  const meta = STATUS_META[order.status];
  const active = ["confirmed", "preparing", "on_the_way"].includes(order.status);
  const deliveredAt =
    order.events.find((event) => event.status === "delivered")?.at ??
    order.placedAt;
  const etaMinutes =
    order.status === "on_the_way"
      ? Math.max(1, Math.round((1 - progress) * 12))
      : order.status === "delivered"
        ? 0
        : order.status === "preparing"
          ? 18
          : 24;

  return (
    <div className="pb-8">
      <PageHeader
        title="Track order"
        subtitle={order.code}
        solid
        right={
          <Link
            to="/orders"
            className="flex h-10 items-center gap-1 rounded-full border border-line bg-white px-3 text-[11px] font-bold text-ink transition hover:border-brand/30"
          >
            My orders <ChevronRight size={13} />
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-3">
            <section
              className={cn(
                "overflow-hidden rounded-3xl border p-4 shadow-card sm:p-5",
                order.status === "cancelled"
                  ? "border-rose-100 bg-rose-50/60"
                  : order.status === "delivered"
                    ? "border-emerald-100 bg-emerald-50/60"
                    : "border-brand/20 bg-brand-soft/40",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                    order.status === "cancelled"
                      ? "bg-rose-100 text-rose-600"
                      : order.status === "delivered"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-brand text-white",
                  )}
                >
                  {order.status === "delivered" ? (
                    <PackageCheck size={23} />
                  ) : order.status === "cancelled" ? (
                    <XCircle size={23} />
                  ) : order.status === "on_the_way" ? (
                    <Bike size={23} />
                  ) : order.status === "preparing" ? (
                    <ChefHat size={23} />
                  ) : (
                    <CheckCircle2 size={23} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
                      {order.status === "delivered" ? "Order arrived!" : meta.description}
                    </h1>
                    <StatusPill status={order.status} />
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    {order.status === "delivered"
                      ? `Your order from ${order.restaurantName} arrived at ${formatTime(
                          order.events.find((event) => event.status === "delivered")
                            ?.at ?? order.placedAt,
                        )}.`
                      : order.status === "cancelled"
                        ? "This order was cancelled. No payment will be collected."
                        : order.status === "on_the_way"
                          ? `${order.driver.name} is ${etaMinutes} min away with your order.`
                          : order.status === "preparing"
                            ? `${order.restaurantName} is cooking your food fresh.`
                            : "We have sent your order to the restaurant."}
                  </p>
                  {active && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-brand shadow-sm">
                        <Clock3 size={12} />{" "}
                        {order.status === "on_the_way" && progress >= 0.9
                          ? "Arriving now"
                          : `ETA ${etaMinutes} min`}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-muted shadow-sm">
                        <MapPin size={12} /> {order.address.split(",")[1]?.trim() ?? "Yangon"}
                      </span>
                    </div>
                  )}
                  {order.status === "on_the_way" && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[9px] font-semibold text-muted">
                        <span>Restaurant</span>
                        <span className="text-brand">{Math.round(progress * 100)}%</span>
                        <span>You</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
                        <span
                          className="block h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
                          style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {order.autoAdvance && active && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-[10px] font-medium text-muted">
                  <Sparkles size={13} className="text-brand" />
                  Live updates: this order moves through each stage
                  automatically, so you can follow along without refreshing.
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-3xl border border-line bg-white p-2 shadow-card">
              <TrackingMap
                restaurant={
                  restaurant
                    ? {
                        lat: restaurant.lat,
                        lng: restaurant.lng,
                        name: restaurant.name,
                      }
                    : {
                        lat: order.lat + 0.008,
                        lng: order.lng + 0.008,
                        name: order.restaurantName,
                      }
                }
                customer={{
                  lat: order.lat,
                  lng: order.lng,
                  address: order.address,
                }}
                driver={{
                  lat: driverPosition.lat,
                  lng: driverPosition.lng,
                  name: order.driver.name,
                  plate: order.driver.plate,
                }}
                showDriver={order.status === "on_the_way"}
                height={280}
              />
            </section>

            <section className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold">Order progress</h2>
                <span className="text-[10px] font-medium text-muted">
                  {order.events.length} updates
                </span>
              </div>
              <div className="mt-4">
                {order.status === "cancelled" ? (
                  <div className="space-y-3">
                    {order.events.map((event) => (
                      <div key={event.status} className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                          <XCircle size={14} />
                        </span>
                        <div>
                          <p className="text-xs font-bold">
                            {STATUS_META[event.status].label}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted">
                            {formatTime(event.at)}
                            {event.note ? ` · ${event.note}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-0">
                    {steps.map((step, index) => {
                      const event = order.events.find(
                        (item) => item.status === step.status,
                      );
                      const complete = Boolean(event);
                      const isCurrent =
                        order.status === step.status && order.status !== "delivered";
                      const Icon = step.icon;
                      return (
                        <div key={step.status} className="relative flex gap-3 pb-5 last:pb-0">
                          {index < steps.length - 1 && (
                            <span
                              className={cn(
                                "absolute left-3.5 top-7 h-[calc(100%-12px)] w-px",
                                complete ? "bg-brand/40" : "bg-line",
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                              complete
                                ? "border-brand bg-brand text-white"
                                : "border-line bg-white text-muted/40",
                              isCurrent && "animate-pulse-ring",
                            )}
                          >
                            <Icon size={13} />
                          </span>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={cn(
                                  "text-xs font-bold",
                                  complete ? "text-ink" : "text-muted/60",
                                )}
                              >
                                {step.label}
                              </p>
                              {event && (
                                <span className="text-[9px] font-medium text-muted">
                                  {formatTime(event.at)}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[10px] text-muted">
                              {event
                                ? step.status === "on_the_way"
                                  ? `${order.driver.name} picked up your order`
                                  : step.status === "delivered"
                                    ? "Delivered to your address"
                                    : step.status === "preparing"
                                      ? "The kitchen is preparing your food"
                                      : "Restaurant received your order"
                                : "Pending"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {order.status === "delivered" && (
              <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-4 shadow-card sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                    <PackageCheck size={24} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold">Order arrived!</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      Delivered to your address. Thanks for ordering with YumGo — enjoy your meal!
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="hidden sm:inline-flex"
                    onClick={() => navigate(`/orders/${order.id}/success`)}
                  >
                    View receipt <ChevronRight size={14} />
                  </Button>
                </div>
                <Button
                  className="mt-3 w-full sm:hidden"
                  onClick={() => navigate(`/orders/${order.id}/success`)}
                >
                  View receipt <ChevronRight size={16} />
                </Button>
              </section>
            )}
          </div>

          <aside className="space-y-3 lg:sticky lg:top-6">
            {["on_the_way", "delivered"].includes(order.status) ? (
              <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold">Your rider</h2>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                    {order.status === "delivered" ? "Completed" : "Live"}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      name={order.driver.name}
                      color={order.driver.avatarColor}
                      size={52}
                    />
                    {order.status === "on_the_way" && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand text-white">
                        <Bike size={10} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{order.driver.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {order.driver.plate} · ★ {order.driver.rating}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      {order.status === "delivered"
                        ? "Delivery complete"
                        : `${etaMinutes} min away`}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${order.driver.phone.replace(/\s+/g, "")}`}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand text-[11px] font-bold text-white transition hover:bg-brand-dark"
                  >
                    <Phone size={14} /> Call
                  </a>
                  <Link
                    to="/profile/help"
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-line bg-white text-[11px] font-bold transition hover:border-brand/30"
                  >
                    <MessageCircle size={14} /> Get help
                  </Link>
                </div>
              </section>
            ) : (
              <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
                    <Bike size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">Rider assignment</p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      We will assign a rider once your food is ready.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold">Order summary</h2>
                <span className="text-[10px] font-semibold text-muted">
                  {order.code}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-cream/70 p-2.5">
                <img
                  src={order.restaurantImage}
                  alt={order.restaurantName}
                  className="h-11 w-11 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{order.restaurantName}</p>
                  <p className="text-[10px] text-muted">
                    {order.items.reduce((sum, item) => sum + item.qty, 0)} items ·{" "}
                    {formatMMK(order.total)}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {order.items.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex items-center justify-between gap-2 text-[10px]"
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
              <div className="my-3 h-px bg-line" />
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between text-muted">
                  <span>Payment</span>
                  <span className="font-semibold text-ink">
                    {PAYMENT_LABEL[order.paymentMethod]}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Delivery</span>
                  <span className="font-semibold text-ink">
                    {formatMMK(order.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Total</span>
                  <span className="font-extrabold text-brand">
                    {formatMMK(order.total)}
                  </span>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-cream px-2.5 py-2 text-[9px] leading-relaxed text-muted">
                <MapPin size={10} className="mr-1 inline text-brand" />
                {order.address}
              </div>
            </section>

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-muted/70">
              <ShieldCheck size={11} /> Live map powered by OpenStreetMap
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={arrived}
        onClose={() => setArrived(false)}
        title="Order arrived!"
        description={`${order.driver.name} delivered your order from ${order.restaurantName}.`}
        className="sm:max-w-md"
      >
        <div className="relative overflow-hidden px-6 py-6 text-center">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {arrivalConfetti.map((piece, index) => (
              <span
                key={index}
                className="confetti-piece"
                style={{
                  left: piece.left,
                  background: piece.color,
                  animationDelay: piece.delay,
                  animationDuration: piece.duration,
                  transform: `rotate(${piece.rotate})`,
                }}
              />
            ))}
          </div>
          <div className="relative">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand text-white shadow-[0_18px_50px_rgba(0,177,79,0.35)] animate-pulse-ring">
              <PackageCheck size={36} strokeWidth={2.5} />
            </span>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
              <CheckCircle2 size={12} /> Delivered
            </span>
            <p className="mt-3 text-sm font-extrabold">Enjoy every bite!</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Your food made it to your door. Thanks for ordering with YumGo.
            </p>
            <div className="mt-3 rounded-2xl bg-cream px-3 py-2.5 text-[10px] font-semibold text-muted">
              <Clock3 size={11} className="mr-1 inline text-brand" />
              Delivered at {formatTime(deliveredAt)}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setArrived(false)}>
                Keep tracking
              </Button>
              <Button
                onClick={() => {
                  setArrived(false);
                  navigate(`/orders/${order.id}/success`);
                }}
              >
                View receipt
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
