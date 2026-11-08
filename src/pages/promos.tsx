import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgePercent,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Sparkles,
  Tag,
  TicketPercent,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PillTabs } from "@/components/ui/tabs";
import { useMounted } from "@/components/providers";
import { useAdminStore } from "@/lib/store/admin";
import { cn, formatDate, formatMMK } from "@/lib/utils";
import type { Promotion } from "@/lib/types";

type Tab = "available" | "expired";

function PromoCard({
  promotion,
  onCopy,
}: {
  promotion: Promotion;
  onCopy: (code: string) => void;
}) {
  const expired = !promotion.isActive || new Date(promotion.endsAt) < new Date();
  const percent = Math.min(
    100,
    Math.round((promotion.usageCount / Math.max(1, promotion.usageLimit)) * 100),
  );

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-white shadow-card transition",
        expired ? "border-line opacity-75" : "border-line hover:shadow-soft",
      )}
    >
      <div className="flex">
        <div
          className={cn(
            "flex w-[104px] shrink-0 flex-col items-center justify-center gap-1.5 p-3 text-white sm:w-[132px]",
            expired
              ? "bg-gradient-to-br from-slate-400 to-slate-500"
              : "bg-gradient-to-br from-brand to-brand-dark",
          )}
        >
          {promotion.type === "percentage" ? (
            <BadgePercent size={22} />
          ) : (
            <Wallet size={22} />
          )}
          <p className="text-center text-lg font-extrabold leading-none tracking-tight sm:text-2xl">
            {promotion.type === "percentage"
              ? `${promotion.value}%`
              : formatMMK(promotion.value).replace("Ks ", "Ks")}
          </p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/80">
            {promotion.type === "percentage" ? "Discount" : "Voucher"}
          </p>
        </div>

        <div className="min-w-0 flex-1 p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-tight">
                {promotion.description}
              </p>
              <p className="mt-1 text-[10px] text-muted">
                Min. order {formatMMK(promotion.minOrder)}
                {promotion.maxDiscount
                  ? ` · Up to ${formatMMK(promotion.maxDiscount)}`
                  : ""}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                expired
                  ? "bg-slate-100 text-slate-500"
                  : "bg-emerald-50 text-emerald-600",
              )}
            >
              {expired ? "Expired" : "Active"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand/40 bg-brand-soft/40 px-2.5 py-1.5 font-mono text-[11px] font-bold tracking-wider text-brand">
              <Tag size={11} />
              {promotion.code}
            </span>
            <button
              type="button"
              onClick={() => onCopy(promotion.code)}
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-ink px-2.5 text-[10px] font-bold text-white transition hover:bg-black"
            >
              <Copy size={11} /> Copy
            </button>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[9px] text-muted">
              <span>
                {promotion.usageCount.toLocaleString()} /{" "}
                {promotion.usageLimit.toLocaleString()} used
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 size={10} />
                {expired ? "Ended" : "Ends"} {formatDate(promotion.endsAt)}
              </span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-cream">
              <div
                className={cn(
                  "h-full rounded-full",
                  expired ? "bg-slate-400" : "bg-brand",
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PromosPage() {
  const mounted = useMounted();
  const promotions = useAdminStore((state) => state.promotions);
  const [tab, setTab] = useState<Tab>("available");

  const available = useMemo(
    () =>
      promotions.filter(
        (promotion) =>
          promotion.isActive && new Date(promotion.endsAt) >= new Date(),
      ),
    [promotions],
  );
  const expired = useMemo(
    () =>
      promotions.filter(
        (promotion) =>
          !promotion.isActive || new Date(promotion.endsAt) < new Date(),
      ),
    [promotions],
  );

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`${code} copied to clipboard`);
    } catch {
      toast(`Promo code: ${code}`);
    }
  };

  const visible = tab === "available" ? available : expired;

  return (
    <div className="pb-6">
      <PageHeader
        title="Promos & vouchers"
        subtitle="Offers to make your next order a little sweeter."
        showBack={false}
        right={
          <Link
            to="/restaurants"
            className="flex h-10 items-center gap-1 rounded-full border border-line bg-white px-3 text-[11px] font-bold text-brand transition hover:border-brand/30"
          >
            <Sparkles size={14} /> Order now
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] bg-ink p-5 text-white shadow-soft sm:p-7">
          <div className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-brand/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-brand/15 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/80 backdrop-blur">
                <TicketPercent size={11} /> {available.length} offers live now
              </span>
              <h1 className="mt-3 max-w-md text-2xl font-extrabold leading-tight tracking-[-0.04em] sm:text-3xl">
                Save on every bite with YumGo vouchers.
              </h1>
              <p className="mt-1.5 max-w-sm text-[11px] leading-relaxed text-white/60 sm:text-xs">
                Copy a code and apply it at checkout. Offers refresh every week,
                so check back often.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur">
                <p className="text-2xl font-extrabold text-brand-soft">
                  {available.length}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-white/60">
                  Available
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur">
                <p className="text-2xl font-extrabold">{expired.length}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-white/60">
                  Expired
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4">
          <PillTabs
            tabs={[
              { value: "available", label: "Available", count: available.length },
              { value: "expired", label: "Expired", count: expired.length },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {!mounted ? (
            [1, 2, 3, 4].map((item) => (
              <div key={item} className="skeleton h-[150px] rounded-3xl" />
            ))
          ) : visible.length ? (
            visible.map((promotion) => (
              <PromoCard
                key={promotion.id}
                promotion={promotion}
                onCopy={copyCode}
              />
            ))
          ) : (
            <EmptyState
              className="lg:col-span-2"
              icon={<TicketPercent size={26} />}
              title="No offers here right now"
              description="New vouchers drop regularly. Follow YumGo or check back soon for fresh deals."
              actionLabel="Browse restaurants"
              actionHref="/restaurants"
            />
          )}
        </div>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: <Check size={17} />,
              title: "One code per order",
              text: "Apply your favourite voucher in the cart — one code per order, subject to its minimum spend.",
            },
            {
              icon: <Clock3 size={17} />,
              title: "Time-limited offers",
              text: "Each voucher shows its end date. Expired codes are kept here for reference.",
            },
            {
              icon: <Wallet size={17} />,
              title: "Cash on delivery",
              text: "Pay the rider in cash when your order arrives. No card details are needed.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-line bg-white p-4 shadow-card"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                {item.icon}
              </span>
              <p className="mt-2.5 text-xs font-extrabold">{item.title}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted">
                {item.text}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-4 flex items-center justify-center gap-1 text-[10px] font-semibold text-muted">
          Ready to use a code?
          <Link to="/restaurants" className="inline-flex items-center gap-0.5 font-bold text-brand">
            Start an order <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
