import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  size = "md",
  min = 1,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md";
  min?: number;
  className?: string;
}) {
  const buttonSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-line bg-white p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min - 1, value - 1))}
        className={cn(
          "flex items-center justify-center rounded-full bg-cream text-ink transition hover:bg-brand-soft hover:text-brand disabled:opacity-40",
          buttonSize,
        )}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span className={cn("min-w-4 text-center font-bold", textSize)}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className={cn(
          "flex items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark",
          buttonSize,
        )}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
