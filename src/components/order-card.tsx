import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import { ChevronRight, Clock3, RotateCcw } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { cn, formatDate, formatMMK, STATUS_META } from "@/lib/utils";

export function StatusPill({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
        meta.className,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function OrderCard({
  order,
  className,
  onReorder,
}: {
  order: Order;
  className?: string;
  onReorder?: (order: Order) => void;
}) {
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
  const active = ["confirmed", "preparing", "on_the_way"].includes(order.status);

  return (
    <div
      className={cn(
        "rounded-3xl border border-line bg-white shadow-card transition hover:border-brand/30 hover:shadow-soft",
        className,
      )}
    >
      <Link
        to={`/orders/${order.id}/tracking`}
        className="group block p-3.5"
      >
        <div className="flex items-start gap-3">
          <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-2xl">
            <Image
              src={order.restaurantImage}
              alt={order.restaurantName}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold">
                  {order.restaurantName}
                </h3>
                <p className="mt-0.5 text-[10px] text-muted">
                  {order.code} · {formatDate(order.placedAt, true)}
                </p>
              </div>
              <StatusPill status={order.status} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted">
                {itemCount} item{itemCount > 1 ? "s" : ""} ·{" "}
                <span className="font-bold text-ink">{formatMMK(order.total)}</span>
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand">
                {active ? (
                  <>
                    <Clock3 size={11} />
                    Track
                  </>
                ) : (
                  "View order"
                )}
                <ChevronRight
                  size={14}
                  className="transition group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </div>
        </div>
      </Link>
      {order.status === "delivered" && onReorder && (
        <div className="flex items-center justify-between gap-2 border-t border-line/70 px-3.5 py-2">
          <span className="text-[10px] text-muted">
            Delivered · order again anytime
          </span>
          <button
            type="button"
            onClick={() => onReorder(order)}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-brand transition hover:text-brand-dark"
          >
            <RotateCcw size={11} />
            Reorder
          </button>
        </div>
      )}
    </div>
  );
}
