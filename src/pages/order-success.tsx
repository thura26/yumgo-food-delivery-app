import { useEffect, useMemo, useState } from "react";
import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Download,
  Loader2,
  MapPin,
  PackageCheck,
  RotateCcw,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useOrdersStore } from "@/lib/store/orders";
import { useCartUiStore, type CartEntry } from "@/lib/store/cart-ui";
import { useMounted } from "@/components/providers";
import { useCatalog } from "@/lib/use-catalog";
import { ReviewDialog } from "@/components/review-dialog";
import { formatMMK, PAYMENT_LABEL } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const confettiColors = ["#00B14F", "#F4B740", "#2F9E63", "#3B82F6", "#EC4899", "#8B5CF6"];

export default function SuccessPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mounted = useMounted();
  const catalog = useCatalog();
  const order = useOrdersStore((state) =>
    state.orders.find((item) => item.id === params.id),
  );
  const requestAddMany = useCartUiStore((state) => state.requestAddMany);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [redirecting, setRedirecting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(3);
  const restaurant = order ? catalog.find((r) => r.id === order.restaurantId) : undefined;

  // Give the success moment a beat, then hand the customer straight to the
  // live delivery screen. Completed/cancelled orders stay on this page.
  useEffect(() => {
    if (!order) return;
    if (order.status === "delivered" || order.status === "cancelled") {
      setRedirecting(false);
      return;
    }

    setRedirecting(true);
    setSecondsLeft(3);
    const countdown = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(1, current - 1));
    }, 1_000);
    const timer = window.setTimeout(() => {
      navigate(`/orders/${order.id}/tracking`, { replace: true });
    }, 3_000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(timer);
    };
  }, [order, navigate]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 36 }, (_, index) => ({
        left: `${(index * 37) % 100}%`,
        delay: `${(index % 12) * 0.16}s`,
        duration: `${2.4 + (index % 7) * 0.22}s`,
        color: confettiColors[index % confettiColors.length],
        rotate: `${(index * 29) % 360}deg`,
      })),
    [],
  );

  const downloadReceipt = () => {
    if (!order) return;

    const rows = [
      "YumGo — order receipt",
      "",
      `Order: ${order.code}`,
      `Placed: ${new Date(order.placedAt).toLocaleString()}`,
      `Restaurant: ${order.restaurantName}`,
      `Customer: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      `Address: ${order.address}`,
      "",
      "Items:",
      ...order.items.map(
        (item) =>
          `  ${item.qty} × ${item.name} — ${formatMMK(item.price * item.qty)}`,
      ),
      "",
      `Subtotal: ${formatMMK(order.subtotal)}`,
      `Delivery: ${formatMMK(order.deliveryFee)}`,
      `Service fee: ${formatMMK(order.serviceFee)}`,
      `Discount: ${formatMMK(order.discount)}`,
      `Total: ${formatMMK(order.total)}`,
      `Payment: ${PAYMENT_LABEL[order.paymentMethod]}`,
    ];

    const blob = new Blob([rows.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `yumgo-receipt-${order.code}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded");
  };

  const reorder = () => {
    if (!order || !restaurant) {
      navigate("/restaurants");
      return;
    }
    const allItems = restaurant.categories.flatMap(
      (category) => category.items,
    );
    const entries: CartEntry[] = [];

    for (const line of order.items) {
      const menuItem = allItems.find(
        (item) => item.id === line.itemId && item.isAvailable !== false,
      );
      if (menuItem) {
        entries.push({ item: menuItem, qty: line.qty });
      }
    }

    if (entries.length === 0) {
      navigate(`/restaurants/${restaurant.slug}`);
      return;
    }

    const result = requestAddMany(restaurant, entries);
    if (result === "added") {
      toast.success("Items added back to your cart");
      navigate("/cart");
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
      </div>
    );
  }

  const isDelivered = order?.status === "delivered";

  return (
    <main className="relative min-h-screen overflow-hidden bg-cream">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((piece, index) => (
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

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-5 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-sm font-extrabold tracking-tight"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand text-white">
              <Check size={18} strokeWidth={3} />
            </span>
            YumGo
          </Link>
          <Link
            to="/home"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-muted transition hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <div className="relative">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand/20" />
            <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brand text-white shadow-[0_18px_50px_rgba(0, 177, 79,0.35)]">
              <Check size={46} strokeWidth={3} />
            </span>
          </div>

          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
            <PackageCheck size={12} /> {isDelivered ? "Delivered" : "Order placed"}
          </span>
          <h1 className="mt-3 text-balance text-[34px] font-extrabold leading-none tracking-[-0.05em] sm:text-5xl">
            Order successful!
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            {isDelivered
              ? "Thanks for ordering with YumGo. We hope you enjoy every bite — your rider has completed the delivery."
              : "Thanks for ordering with YumGo. Your order has been placed and is on its way to you."}
          </p>

          {order && (
            <div className="mt-7 w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-white text-left shadow-card">
              <div className="flex items-center gap-3 border-b border-line p-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
                  <Image
                    src={order.restaurantImage}
                    alt={order.restaurantName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{order.restaurantName}</p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {order.code} ·{" "}
                    {order.items.reduce((sum, item) => sum + item.qty, 0)} items
                  </p>
                </div>
                <span className="text-base font-extrabold text-brand">
                  {formatMMK(order.total)}
                </span>
              </div>
              <div className="space-y-2 p-4">
                {order.items.map((item) => (
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
                <div className="my-2 h-px bg-line" />
                <div className="flex items-start gap-2 text-[10px] text-muted">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-brand" />
                  <span>{order.address}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>
                    {order.paymentStatus === "paid" ? "Paid" : "Payment"} ·{" "}
                    {PAYMENT_LABEL[order.paymentMethod]}
                  </span>
                  <span className="font-semibold text-ink">
                    {formatMMK(order.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex w-full max-w-md flex-col gap-2.5">
            <Button
              size="lg"
              onClick={() =>
                order ? navigate(`/orders/${order.id}/tracking`) : navigate("/orders")
              }
            >
              Track order <ArrowRight size={17} />
            </Button>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline" onClick={reorder}>
                <RotateCcw size={15} /> Order again
              </Button>
              <Button variant="outline" onClick={downloadReceipt}>
                <Download size={15} /> Receipt
              </Button>
            </div>
            {redirecting && (
              <div className="mt-1 flex w-full flex-col items-center gap-1.5">
                <div className="h-1 w-full overflow-hidden rounded-full bg-brand/15">
                  <span className="block h-full w-full origin-left rounded-full bg-brand animate-track-progress" />
                </div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-brand">
                  <Loader2 size={12} className="animate-spin" />
                  Opening live tracking in
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-extrabold text-white">
                    {secondsLeft}s
                  </span>
                </p>
              </div>
            )}
          </div>

          {order && (
            <div className="mt-6 flex flex-col items-center gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                How was your experience?
              </p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => {
                      setReviewRating(score);
                      setReviewOpen(true);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-muted transition hover:border-warning hover:text-warning"
                    aria-label={`Rate ${score} stars`}
                  >
                    <Star size={16} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-muted/60">
          YumGo · Cash on Delivery · pay the rider when your order arrives
        </p>
      </div>

      {order && (
        <ReviewDialog
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          restaurantId={order.restaurantId}
          restaurantName={order.restaurantName}
          initialRating={reviewRating}
        />
      )}
    </main>
  );
}
