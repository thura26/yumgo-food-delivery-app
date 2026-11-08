import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search restaurants or dishes...",
  onSubmit,
  showFilter = false,
  onFilter,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  showFilter?: boolean;
  onFilter?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-12 items-center gap-2 rounded-2xl border border-line bg-white px-4 shadow-card transition focus-within:border-brand/40 focus-within:shadow-soft",
        className,
      )}
    >
      <Search size={18} className="shrink-0 text-muted" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSubmit?.();
        }}
        placeholder={placeholder}
        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
        aria-label="Search"
      />
      {showFilter && (
        <button
          type="button"
          onClick={onFilter}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cream text-ink transition hover:bg-brand-soft hover:text-brand"
          aria-label="Filters"
        >
          <SlidersHorizontal size={16} />
        </button>
      )}
    </div>
  );
}
