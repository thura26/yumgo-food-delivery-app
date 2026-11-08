import { useMemo, useState } from "react";
import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgePercent,
  Bike,
  ChevronRight,
  MessageSquareText,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { QuantityStepper } from "@/components/quantity-stepper";
import {
  getCartSubtotal,
  useCartStore,
} from "@/lib/store/cart";
import { useAdminStore } from "@/lib/store/admin";
import { useMounted } from "@/components/providers";
import {
  calculateDiscount,
  formatMMK,
  PAYMENT_LABEL,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const navigate = useNavigate();
  const mounted = useMounted();
  const restaurant = useCartStore((state) => state.restaurant);
  const lines = useCartStore((state) => state.lines);
  const notes = useCartStore((state) => state.notes);
  const promoCode = useCartStore((state) => state.promoCode);
  const setQty = useCartStore((state) => state.setQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);
  const setNotes = useCartStore((state) => state.setNotes);
  const setPromoCode = useCartStore((state) => state.setPromoCode);
  const promotions = useAdminStore((state) => state.promotions);
  const [promoInput, setPromoInput] = useState(promoCode ?? "");

  const subtotal = getCartSubtotal(lines);
  const deliveryFee = restaurant?.deliveryFee ?? 0;
  const serviceFee = lines.length ? 1000 : 0;
  const promo = useMemo(
    () =>
      promotions.find(
        (item) => item.code.toLowerCase() === (promoCode ?? "").toLowerCase(),
      ),
    [promotions, promoCode],
  );
  const discount = calculateDiscount(promo, subtotal);
  const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);

  const applyPromo = () => {
    const normalized = promoInput.trim().toUpperCase();
    if (!normalized) {
      setPromoCode(null);
      return;
    }
    const found = promotions.find(
      (item) => item.code.toUpperCase() === normalized,
    );
    if (!found || !found.isActive) {
      toast.error("That promo code is not valid.");
      return;
    }
    if (subtotal < found.minOrder) {
      toast.error(`Minimum order for ${found.code} is ${formatMMK(found.minOrder)}.`);
      return;
    }
    setPromoCode(found.code);
    toast.success(`${found.code} applied — you saved ${formatMMK(calculateDiscount(found, subtotal))}`);
  };

  const removePromo = () => {
    setPromoCode(null);
    setPromoInput("");
    toast("Promo removed");
  };

  if (!mounted) {
    return (
      <div className="px-4 py-6">
        <div className="skeleton h-10 w-40 rounded-full" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-24 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHeader
        title="Your cart"
        subtitle={restaurant ? restaurant.name : "Nothing here yet"}
        right={
          lines.length ? (
            <button
              type="button"
              onClick={() => {
                clear();
                toast("Cart cleared");
              }}
              className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[11px] font-bold text-muted transition hover:text-rose-600"
            >
              <Trash2 size={14} /> Clear
            </button>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        {!lines.length ? (
          <EmptyState
            icon={<ShoppingBag size={26} />}
            title="Your cart is empty"
            description="Browse nearby kitchens and add something delicious to get started."
            actionLabel="Browse restaurants"
            actionHref="/restaurants"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-3xl border border-line bg-white p-3.5 shadow-card">
                {restaurant && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
                    <Image
                      src={restaurant.image}
                      alt={restaurant.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    Ordering from
                  </p>
                  <p className="mt-0.5 truncate text-sm font-extrabold">
                    {restaurant?.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted">
                    <Bike size={11} /> {formatMMK(deliveryFee)} delivery · 20–30 min
                  </p>
                </div>
                {restaurant && (
                  <Link
                    to={`/restaurants/${restaurant.slug}`}
                    className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-[10px] font-bold text-brand transition hover:border-brand/30"
                  >
                    Add more
                  </Link>
                )}
              </div>

              <div className="space-y-2.5">
                {lines.map((line) => (
                  <div
                    key={line.itemId}
                    className="flex gap-3 rounded-3xl border border-line bg-white p-3 shadow-card"
                  >
                    <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-2xl">
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        sizes="76px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-xs font-bold sm:text-sm">
                            {line.name}
                          </h3>
                          <p className="mt-0.5 text-[10px] text-muted">
                            {formatMMK(line.price)} each
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            removeItem(line.itemId);
                            toast(`${line.name} removed`);
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Remove ${line.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold tracking-tight">
                          {formatMMK(line.price * line.qty)}
                        </span>
                        <QuantityStepper
                          value={line.qty}
                          min={1}
                          size="sm"
                          onChange={(next) => {
                            if (next <= 0) removeItem(line.itemId);
                            else setQty(line.itemId, next);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
                <label
                  htmlFor="notes"
                  className="flex items-center gap-2 text-xs font-bold"
                >
                  <MessageSquareText size={15} className="text-brand" />
                  Add a note for the restaurant
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="E.g. less spicy, no peanuts, extra sauce..."
                  rows={3}
                  className="mt-2.5 w-full resize-none rounded-2xl border border-line bg-cream/60 px-3.5 py-3 text-xs outline-none transition placeholder:text-muted/60 focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
                />
              </div>

              <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <BadgePercent size={15} className="text-brand" />
                  Promo code
                </div>
                {promoCode && promo ? (
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-emerald-50 px-3 py-2.5">
                    <div>
                      <p className="text-[11px] font-bold text-emerald-700">
                        {promo.code} applied
                      </p>
                      <p className="text-[10px] text-emerald-600">
                        You save {formatMMK(discount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removePromo}
                      className="text-[10px] font-bold text-emerald-700 underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="mt-2.5 flex gap-2">
                    <input
                      value={promoInput}
                      onChange={(event) => setPromoInput(event.target.value)}
                      placeholder="Enter promo code"
                      className="h-10 min-w-0 flex-1 rounded-2xl border border-line bg-cream/60 px-3.5 text-xs font-semibold uppercase tracking-wide outline-none focus:border-brand/40 focus:bg-white"
                    />
                    <Button size="sm" onClick={applyPromo} className="h-10 px-4">
                      Apply
                    </Button>
                  </div>
                )}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {promotions
                    .filter((item) => item.isActive)
                    .slice(0, 3)
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setPromoInput(item.code);
                          if (subtotal < item.minOrder) {
                            toast.error(
                              `Minimum order ${formatMMK(item.minOrder)} for ${item.code}`,
                            );
                            return;
                          }
                          setPromoCode(item.code);
                          toast.success(`${item.code} applied`);
                        }}
                        className="rounded-full border border-dashed border-brand/30 bg-brand-soft/40 px-2 py-1 text-[9px] font-bold text-brand"
                      >
                        {item.code}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-6">
              <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
                    <UtensilsCrossed size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">Order summary</p>
                    <p className="text-[10px] text-muted">
                      {lines.reduce((sum, line) => sum + line.qty, 0)} items
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-muted">
                    <span>Subtotal</span>
                    <span className="font-semibold text-ink">
                      {formatMMK(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Delivery fee</span>
                    <span className="font-semibold text-ink">
                      {formatMMK(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Service fee</span>
                    <span className="font-semibold text-ink">
                      {formatMMK(serviceFee)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600">
                      <span>Promo discount</span>
                      <span className="font-semibold">− {formatMMK(discount)}</span>
                    </div>
                  )}
                  <div className="my-2 h-px bg-line" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold">Total</span>
                    <span className="text-xl font-extrabold tracking-tight text-brand">
                      {formatMMK(total)}
                    </span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="mt-5 w-full"
                  onClick={() => navigate("/checkout")}
                >
                  Continue to checkout <ArrowRight size={17} />
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1 text-center text-[10px] text-muted">
                  <Bike size={12} /> Estimated delivery 20–30 min
                </p>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-muted/70">
                  {Object.values(PAYMENT_LABEL).map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-cream px-1.5 py-0.5"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                to={restaurant ? `/restaurants/${restaurant.slug}` : "/restaurants"}
                className="mt-3 flex h-11 items-center justify-center gap-1 rounded-2xl border border-dashed border-line bg-white/60 text-[11px] font-bold text-muted transition hover:border-brand/30 hover:text-brand"
              >
                <ChevronRight size={14} className="rotate-180" />
                Add more items
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
