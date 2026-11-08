import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-soft text-brand-dark">
        {icon}
      </span>
      <h3 className="mt-4 text-base font-extrabold tracking-tight">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-dark"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
