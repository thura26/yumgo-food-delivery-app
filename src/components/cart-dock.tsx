import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { cn, formatMMK } from "@/lib/utils";
import { getCartCount, getCartSubtotal, useCartStore } from "@/lib/store/cart";
import { useCartUiStore } from "@/lib/store/cart-ui";
import { useMounted } from "@/components/providers";

const HIDDEN_ROUTES = ["/cart", "/checkout"];

export function isCartDockHidden(pathname: string) {
  return (
    HIDDEN_ROUTES.includes(pathname) || pathname.startsWith("/orders/")
  );
}

export function CartDock({ raised }: { raised: boolean }) {
  const mounted = useMounted();
  const { pathname } = useLocation();
  const lines = useCartStore((state) => state.lines);
  const openDrawer = useCartUiStore((state) => state.openDrawer);
  const count = mounted ? getCartCount(lines) : 0;
  const subtotal = mounted ? getCartSubtotal(lines) : 0;
  const visible = mounted && count > 0 && !isCartDockHidden(pathname);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn(
            "fixed left-3 right-3 z-40 mx-auto max-w-lg lg:hidden",
            raised
              ? "bottom-[calc(92px+env(safe-area-inset-bottom))]"
              : "bottom-[calc(12px+env(safe-area-inset-bottom))]",
          )}
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 18, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 340 }}
        >
          <motion.button
            type="button"
            onClick={openDrawer}
            whileTap={{ scale: 0.99 }}
            className="flex h-14 w-full items-center gap-3 rounded-2xl bg-brand px-3.5 text-left text-white shadow-[0_16px_40px_rgba(0,177,79,0.35)]"
            aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}, ${formatMMK(subtotal)}`}
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ShoppingBag size={18} />
              <motion.span
                key={count}
                initial={{ scale: 0.55, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 16, stiffness: 420 }}
                className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-extrabold text-brand-dark shadow-sm"
              >
                {count}
              </motion.span>
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/75">
                {count === 1 ? "1 item" : `${count} items`}
              </span>
              <span className="mt-0.5 block truncate text-sm font-extrabold tracking-tight">
                {formatMMK(subtotal)}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-white px-3 py-2 text-xs font-extrabold text-brand-dark">
              View cart
              <ChevronRight size={14} strokeWidth={2.6} />
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CartSpacer({ showNav }: { showNav: boolean }) {
  const mounted = useMounted();
  const { pathname } = useLocation();
  const lines = useCartStore((state) => state.lines);
  const count = mounted ? getCartCount(lines) : 0;
  const visible = mounted && count > 0 && !isCartDockHidden(pathname);

  if (!visible) {
    return <div aria-hidden className={showNav ? "h-[92px] lg:h-0" : "h-0"} />;
  }

  return (
    <div
      aria-hidden
      className={cn(
        "lg:h-0",
        showNav ? "h-[170px]" : "h-[88px]",
      )}
    />
  );
}
