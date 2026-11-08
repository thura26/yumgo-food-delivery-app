import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  className,
  showCount = true,
}: {
  value: number;
  count?: number;
  className?: string;
  showCount?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold text-ink",
        className,
      )}
    >
      <Star size={12} className="fill-warning text-warning" />
      {value.toFixed(1)}
      {showCount && count !== undefined && (
        <span className="font-medium text-muted">({count.toLocaleString()})</span>
      )}
    </span>
  );
}
