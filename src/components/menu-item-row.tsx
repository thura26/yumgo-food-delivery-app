import { Image } from "@/components/ui/image";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { MenuItem, Restaurant } from "@/lib/types";
import { cn, formatMMK } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import { useCartUiStore } from "@/lib/store/cart-ui";
import { useMounted } from "@/components/providers";
import { QuantityStepper } from "@/components/quantity-stepper";

export function MenuItemRow({
  item,
  restaurant,
  className,
  isAvailable = true,
}: {
  item: MenuItem;
  restaurant: Restaurant;
  className?: string;
  isAvailable?: boolean;
}) {
  const mounted = useMounted();
  const lines = useCartStore((state) => state.lines);
  const setQty = useCartStore((state) => state.setQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const requestAdd = useCartUiStore((state) => state.requestAdd);

  const line = lines.find((entry) => entry.itemId === item.id);
  const qty = mounted && line ? line.qty : 0;
  const available = isAvailable && item.isAvailable !== false;

  const handleAdd = () => {
    if (!available) return;
    const result = requestAdd(restaurant, item);
    if (result === "added") {
      toast.success(`${item.name} added to cart`);
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 rounded-3xl border border-line bg-white p-3 shadow-card",
        className,
      )}
    >
      <div className="relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="96px"
          className="object-cover"
        />
        {item.isPopular && (
          <span className="absolute left-1 top-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-brand shadow-sm">
            Popular
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start gap-2">
            <h3 className="line-clamp-1 flex-1 text-sm font-bold">{item.name}</h3>
            {!available && (
              <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-600">
                Sold out
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">
            {item.description}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-extrabold tracking-tight">
            {formatMMK(item.price)}
          </span>
          {qty > 0 ? (
            <QuantityStepper
              value={qty}
              min={1}
              size="sm"
              onChange={(next) => {
                if (next <= 0) removeItem(item.id);
                else setQty(item.id, next);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={!available}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-soft transition hover:bg-brand-dark disabled:bg-line disabled:text-muted disabled:shadow-none"
              aria-label={`Add ${item.name}`}
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
