import { Image } from "@/components/ui/image";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useCartUiStore } from "@/lib/store/cart-ui";
import { formatMMK } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function CartReplaceDialog() {
  const navigate = useNavigate();
  const currentRestaurant = useCartStore((state) => state.restaurant);
  const currentLines = useCartStore((state) => state.lines);
  const pending = useCartUiStore((state) => state.pendingReplacement);
  const confirmReplacement = useCartUiStore(
    (state) => state.confirmReplacement,
  );
  const cancelReplacement = useCartUiStore((state) => state.cancelReplacement);

  const pendingCount =
    pending?.entries.reduce((sum, entry) => sum + entry.qty, 0) ?? 0;
  const pendingSubtotal =
    pending?.entries.reduce(
      (sum, entry) => sum + entry.item.price * entry.qty,
      0,
    ) ?? 0;

  const handleConfirm = () => {
    const after = confirmReplacement();
    if (after === "cart") {
      navigate("/cart");
    }
  };

  return (
    <Modal
      open={Boolean(pending)}
      onClose={cancelReplacement}
      title="Replace your cart?"
      description="You can only order from one restaurant at a time."
      className="sm:max-w-md"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={cancelReplacement}>
            Keep current
          </Button>
          <Button onClick={handleConfirm}>
            Replace cart
          </Button>
        </div>
      }
    >
      {pending && (
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-center gap-3 py-1">
            <div className="min-w-0 flex-1 rounded-2xl border border-line bg-cream/60 p-3">
              <div className="flex items-center gap-2">
                {currentRestaurant && (
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={currentRestaurant.image}
                      alt={currentRestaurant.name}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted">
                    Current cart
                  </p>
                  <p className="truncate text-[11px] font-bold">
                    {currentRestaurant?.name ?? "Your cart"}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-muted">
                {currentLines.reduce((sum, line) => sum + line.qty, 0)}{" "}
                {currentLines.reduce((sum, line) => sum + line.qty, 0) === 1
                  ? "item"
                  : "items"}{" "}
                ·{" "}
                {formatMMK(
                  currentLines.reduce(
                    (sum, line) => sum + line.price * line.qty,
                    0,
                  ),
                )}
              </p>
            </div>

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
              <ArrowLeftRight size={14} />
            </span>

            <div className="min-w-0 flex-1 rounded-2xl border border-brand/25 bg-brand-soft/60 p-3">
              <div className="flex items-center gap-2">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={pending.restaurant.cover}
                    alt={pending.restaurant.name}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-brand-dark">
                    New cart
                  </p>
                  <p className="truncate text-[11px] font-bold">
                    {pending.restaurant.name}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-muted">
                {pendingCount} {pendingCount === 1 ? "item" : "items"} ·{" "}
                {formatMMK(pendingSubtotal)}
              </p>
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-[10px] leading-relaxed text-amber-800">
            <ShoppingBag size={13} className="mt-0.5 shrink-0" />
            The items in your current cart will be removed. This cannot be
            undone.
          </p>
        </div>
      )}
    </Modal>
  );
}
