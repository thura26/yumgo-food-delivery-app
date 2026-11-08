import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: "brand" | "green" | "blue" | "violet" | "amber" | "rose";
  trend?: { value: string; positive?: boolean };
}) {
  const tones = {
    brand: "bg-brand-soft text-brand-dark",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  }[tone];

  return (
    <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-2xl",
            tones,
          )}
        >
          {icon}
        </span>
        {trend && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[9px] font-bold",
              trend.positive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600",
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-[-0.03em]">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-muted">{label}</p>
      {hint && <p className="mt-1 text-[9px] text-muted/70">{hint}</p>}
    </div>
  );
}

export function AdminCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-line bg-white shadow-card",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-sm font-extrabold tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 truncate text-[10px] text-muted">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
            {children}
          </tr>
        </thead>
      </table>
    </div>
  );
}
