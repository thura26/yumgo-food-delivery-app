import { useNavigate } from "react-router-dom";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  showBack = true,
  right,
  className,
  sticky = true,
  solid = false,
}: {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  className?: string;
  sticky?: boolean;
  /** Use an opaque background instead of the translucent glass effect. */
  solid?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        "z-30 flex items-center gap-3 px-4 pb-3 pt-4 sm:px-6 lg:px-8 lg:pt-6",
        sticky && "sticky top-0 border-b border-line/70",
        sticky && (solid ? "bg-cream" : "glass"),
        className,
      )}
    >
      {showBack && (
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/home");
            }
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition hover:border-brand/30"
          aria-label="Go back"
        >
          <ArrowLeft size={19} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {title && (
          <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-0.5 truncate text-[11px] text-muted sm:text-xs">
            {subtitle}
          </p>
        )}
      </div>
      {right ?? (
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-muted transition hover:text-ink"
          aria-label="More options"
        >
          <MoreHorizontal size={19} />
        </button>
      )}
    </header>
  );
}
