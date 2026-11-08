import { useEffect, useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bike,
  ShoppingBag,
  Store,
  Trash2,
  X,
} from "lucide-react";
import {
  getCartCount,
  getCartSubtotal,
  useCartStore,
} from "@/lib/store/cart";
import { useCartUiStore } from "@/lib/store/cart-ui";
import { formatMMK } from "@/lib/utils";
import { buttonStyles } from "@/components/ui/button";
import { QuantityStepper } from "@/components/quantity-stepper";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export function CartDrawer() {
  const navigate = useNavigate();
  const open = useCartUiStore((state) => state.drawerOpen);
  const closeDrawer = useCartUiStore((state) => state.closeDrawer);
  const restaurant = useCartStore((state) => state.restaurant);
  const lines = useCartStore((state) => state.lines);
  const setQty = useCartStore((state) => state.setQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const count = getCartCount(lines);
  const subtotal = getCartSubtotal(lines);
  const isDesktop = useIsDesktop();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousActive = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKeyDown);

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 40);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      previousActive?.focus?.();
    };
  }, [open, closeDrawer]);

  const goTo = (href: string) => {
    closeDrawer();
    navigate(href);
  };

  const panelMotion = isDesktop
    ? {
        initial: { x: 52, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 52, opacity: 0 },
      }
    : {
        initial: { y: 52, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: 52, opacity: 0 },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-stretch sm:justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDrawer}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:h-full sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-[28px]"
            {...panelMotion}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line sm:hidden" />

            <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-3 sm:pt-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold tracking-tight">
                    Your cart
                  </h2>
                  {count > 0 && (
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand-dark">
                      {count} {count === 1 ? "item" : "items"}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted">
                  Review your picks before checkout.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeDrawer}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-muted transition hover:bg-brand-soft hover:text-brand-dark"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {restaurant && (
              <div className="mx-5 mb-3 flex items-center gap-3 rounded-2xl border border-line bg-cream/70 p-2.5">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={restaurant.image}
                    alt={restaurant.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                    Ordering from
                  </p>
                  <p className="truncate text-xs font-extrabold">
                    {restaurant.name}
                  </p>
                </div>
                <Link
                  to={`/restaurants/${restaurant.slug}`}
                  onClick={closeDrawer}
                  className="shrink-0 rounded-full bg-white px-2.5 py-1.5 text-[10px] font-bold text-brand-dark shadow-sm transition hover:bg-brand-soft"
                >
                  Add more
                </Link>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
              {lines.length === 0 ? (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-cream/50 px-6 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-dark shadow-card">
                    <ShoppingBag size={24} />
                  </span>
                  <p className="mt-3 text-sm font-extrabold">
                    Your cart is empty
                  </p>
                  <p className="mt-1 max-w-[220px] text-[11px] leading-relaxed text-muted">
                    Add something delicious from a nearby restaurant to get
                    started.
                  </p>
                  <button
                    type="button"
                    onClick={() => goTo("/restaurants")}
                    className={buttonStyles({
                      size: "sm",
                      className: "mt-4",
                    })}
                  >
                    Browse restaurants
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lines.map((line) => (
                    <div
                      key={line.itemId}
                      className="flex gap-3 rounded-2xl border border-line bg-white p-2.5 shadow-card"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={line.image}
                          alt={line.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold">
                              {line.name}
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted">
                              {formatMMK(line.price)} each
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(line.itemId)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Remove ${line.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold tracking-tight">
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
              )}
            </div>

            {lines.length > 0 && (
              <div className="shrink-0 border-t border-line bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3.5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                      Subtotal
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted">
                      <Bike size={11} /> Delivery fee calculated at checkout
                    </p>
                  </div>
                  <p className="text-xl font-extrabold tracking-tight">
                    {formatMMK(subtotal)}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => goTo("/cart")}
                    className={buttonStyles({
                      variant: "outline",
                      className: "h-11",
                    })}
                  >
                    View cart
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo("/checkout")}
                    className={buttonStyles({ className: "h-11" })}
                  >
                    Checkout <ArrowRight size={15} />
                  </button>
                </div>

                <p className="mt-2 flex items-center justify-center gap-1 text-[9px] text-muted/70">
                  <Store size={10} /> One restaurant per order
                </p>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
