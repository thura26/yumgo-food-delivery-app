import { useMemo, useState } from "react";
import {
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Copy,
  Pencil,
  Plus,
  Search,
  Tag,
  TicketPercent,
  Trash2,
  TrendingUp,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/ui";
import { Modal } from "@/components/ui/modal";
import { PillTabs, Toggle } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/components/providers";
import { useAdminStore } from "@/lib/store/admin";
import type { Promotion } from "@/lib/types";
import { cn, formatDate, formatMMK } from "@/lib/utils";

type Filter = "all" | "active" | "expired";

const emptyDraft = {
  code: "",
  description: "",
  type: "percentage" as "percentage" | "fixed",
  value: 10,
  minOrder: 10000,
  maxDiscount: 5000,
  endsAt: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
  isActive: true,
  usageLimit: 500,
};

export default function AdminPromotionsPage() {
  const mounted = useMounted();
  const promotions = useAdminStore((state) => state.promotions);
  const addPromotion = useAdminStore((state) => state.addPromotion);
  const updatePromotion = useAdminStore((state) => state.updatePromotion);
  const deletePromotion = useAdminStore((state) => state.deletePromotion);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const isExpired = (promotion: Promotion) =>
    !promotion.isActive || new Date(promotion.endsAt) < new Date();

  const counts = useMemo(
    () => ({
      all: promotions.length,
      active: promotions.filter((promotion) => !isExpired(promotion)).length,
      expired: promotions.filter((promotion) => isExpired(promotion)).length,
      uses: promotions.reduce((sum, promotion) => sum + promotion.usageCount, 0),
    }),
    [promotions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return promotions.filter((promotion) => {
      const matchesQuery =
        !q ||
        promotion.code.toLowerCase().includes(q) ||
        promotion.description.toLowerCase().includes(q);
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "active"
            ? !isExpired(promotion)
            : isExpired(promotion);
      return matchesQuery && matchesFilter;
    });
  }, [promotions, query, filter]);

  const stats = useMemo(() => {
    const active = promotions.filter((promotion) => !isExpired(promotion));
    const best = [...promotions].sort(
      (a, b) => b.usageCount - a.usageCount,
    )[0];
    const percentage = active.filter(
      (promotion) => promotion.type === "percentage",
    );
    const averageDiscount = percentage.length
      ? Math.round(
          percentage.reduce((sum, promotion) => sum + promotion.value, 0) /
            percentage.length,
        )
      : 0;

    return {
      bestCode: best && best.usageCount > 0 ? best.code : "—",
      bestHint:
        best && best.usageCount > 0
          ? `${best.usageCount.toLocaleString()} redemptions`
          : "No redemptions yet",
      averageDiscount: percentage.length ? `${averageDiscount}%` : "—",
      averageHint: percentage.length
        ? `Across ${percentage.length} active code${percentage.length === 1 ? "" : "s"}`
        : "No percentage codes active",
      active: active.length,
    };
  }, [promotions]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(true);
  };

  const openEdit = (promotion: Promotion) => {
    setEditingId(promotion.id);
    setDraft({
      code: promotion.code,
      description: promotion.description,
      type: promotion.type,
      value: promotion.value,
      minOrder: promotion.minOrder,
      maxDiscount: promotion.maxDiscount ?? 0,
      endsAt: new Date(promotion.endsAt).toISOString().slice(0, 10),
      isActive: promotion.isActive,
      usageLimit: promotion.usageLimit,
    });
    setOpen(true);
  };

  const save = () => {
    if (!draft.code.trim() || !draft.description.trim()) {
      toast.error("A code and description are required.");
      return;
    }
    if (draft.value <= 0) {
      toast.error("Discount value must be greater than zero.");
      return;
    }
    const normalizedCode = draft.code.trim().toUpperCase().replace(/\s+/g, "");
    const duplicate = promotions.find(
      (promotion) =>
        promotion.code === normalizedCode && promotion.id !== editingId,
    );
    if (duplicate) {
      toast.error("A promotion with this code already exists.");
      return;
    }

    const payload = {
      code: normalizedCode,
      description: draft.description.trim(),
      type: draft.type,
      value: Number(draft.value),
      minOrder: Number(draft.minOrder) || 0,
      maxDiscount:
        draft.type === "percentage" && Number(draft.maxDiscount) > 0
          ? Number(draft.maxDiscount)
          : undefined,
      endsAt: new Date(`${draft.endsAt}T23:59:59`).toISOString(),
      isActive: draft.isActive,
      usageLimit: Math.max(1, Number(draft.usageLimit) || 1),
    };

    if (editingId) {
      updatePromotion(editingId, payload);
      toast.success(`${normalizedCode} updated`);
    } else {
      addPromotion({
        ...payload,
        id: `promo-${Date.now()}`,
        usageCount: 0,
      });
      toast.success(`${normalizedCode} created`);
    }
    setOpen(false);
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`${code} copied`);
    } catch {
      toast(`Promo code: ${code}`);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton h-24 rounded-3xl" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total campaigns",
            value: counts.all,
            icon: <TicketPercent size={16} />,
            tone: "bg-brand-soft text-brand-dark",
          },
          {
            label: "Active codes",
            value: counts.active,
            icon: <CheckCircle2 size={16} />,
            tone: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Expired",
            value: counts.expired,
            icon: <XCircle size={16} />,
            tone: "bg-rose-50 text-rose-600",
          },
          {
            label: "Total redemptions",
            value: counts.uses.toLocaleString(),
            icon: <Users size={16} />,
            tone: "bg-blue-50 text-blue-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-white p-3.5 shadow-card"
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl",
                stat.tone,
              )}
            >
              {stat.icon}
            </span>
            <p className="mt-2 text-xl font-extrabold tracking-tight">{stat.value}</p>
            <p className="text-[9px] font-semibold text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <AdminCard
        title="Promotion campaigns"
        subtitle="Create voucher codes and control their availability"
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-brand px-3 text-[10px] font-bold text-white transition hover:bg-brand-dark"
          >
            <Plus size={12} /> New promotion
          </button>
        }
        bodyClassName="p-0 sm:p-0"
      >
        <div className="space-y-3 border-b border-line/70 px-4 py-3 sm:px-5">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-cream/60 px-3">
            <Search size={15} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search promotion codes or descriptions..."
              className="h-full w-full bg-transparent text-[11px] outline-none placeholder:text-muted/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted hover:text-ink"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <PillTabs
            size="sm"
            tabs={[
              { value: "all", label: "All", count: counts.all },
              { value: "active", label: "Active", count: counts.active },
              { value: "expired", label: "Expired", count: counts.expired },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div className="grid gap-2.5 p-4 lg:grid-cols-2 sm:p-5">
          {filtered.map((promotion) => {
            const expired = isExpired(promotion);
            const percent = Math.min(
              100,
              Math.round(
                (promotion.usageCount / Math.max(1, promotion.usageLimit)) * 100,
              ),
            );
            return (
              <article
                key={promotion.id}
                className={cn(
                  "rounded-2xl border bg-white p-3.5 transition",
                  expired ? "border-line opacity-80" : "border-line hover:shadow-soft",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                      expired
                        ? "bg-slate-100 text-slate-500"
                        : "bg-brand-soft text-brand-dark",
                    )}
                  >
                    <BadgePercent size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-mono text-xs font-extrabold tracking-wide">
                        {promotion.code}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide",
                          expired
                            ? "bg-slate-100 text-slate-500"
                            : "bg-emerald-50 text-emerald-600",
                        )}
                      >
                        {expired ? "Expired" : "Active"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[10px] text-muted">
                      {promotion.description}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold">
                      {promotion.type === "percentage"
                        ? `${promotion.value}% off`
                        : `${formatMMK(promotion.value)} off`}{" "}
                      <span className="font-normal text-muted">
                        · min {formatMMK(promotion.minOrder)}
                      </span>
                    </p>
                  </div>
                  <Toggle
                    checked={promotion.isActive}
                    onChange={(next) => {
                      updatePromotion(promotion.id, { isActive: next });
                      toast.success(
                        `${promotion.code} ${next ? "activated" : "paused"}`,
                      );
                    }}
                    label={`Toggle ${promotion.code}`}
                  />
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[9px] text-muted">
                    <span>
                      {promotion.usageCount.toLocaleString()} /{" "}
                      {promotion.usageLimit.toLocaleString()} redeemed
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={9} />
                      {formatDate(promotion.endsAt)}
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

                <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-2.5">
                  <button
                    type="button"
                    onClick={() => copy(promotion.code)}
                    className="inline-flex items-center gap-1 text-[9px] font-bold text-brand"
                  >
                    <Copy size={10} /> Copy code
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(promotion)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-ink"
                      aria-label={`Edit ${promotion.code}`}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deletePromotion(promotion.id);
                        toast.success(`${promotion.code} deleted`);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Delete ${promotion.code}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-line bg-cream/40 p-10 text-center">
              <TicketPercent size={22} className="mx-auto text-muted/50" />
              <p className="mt-2 text-xs font-bold">No promotions match</p>
              <p className="mt-1 text-[10px] text-muted">
                Try a different search or create a new campaign.
              </p>
              <Button size="sm" className="mt-3" onClick={openCreate}>
                <Plus size={13} /> New promotion
              </Button>
            </div>
          )}
        </div>
      </AdminCard>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: <TrendingUp size={16} />,
            label: "Best performing",
            value: stats.bestCode,
            hint: stats.bestHint,
          },
          {
            icon: <Tag size={16} />,
            label: "Average discount",
            value: stats.averageDiscount,
            hint: stats.averageHint,
          },
          {
            icon: <Users size={16} />,
            label: "Active codes",
            value: String(stats.active),
            hint: "Live at checkout right now",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-card"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-extrabold">{item.value}</p>
              <p className="text-[9px] font-semibold text-muted">{item.label}</p>
              <p className="text-[8px] text-muted/70">{item.hint}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit promotion" : "Create a promotion"}
        description="Voucher codes apply at checkout on the customer app."
        className="sm:max-w-xl"
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={save}>
              {editingId ? "Save changes" : "Create promotion"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 px-5 py-4 sm:px-6">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="text-[10px] font-bold text-ink">
              Promo code
              <input
                value={draft.code}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="YUMGO20"
                className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 font-mono text-xs font-bold uppercase tracking-wide outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>
            <label className="text-[10px] font-bold text-ink">
              Ends on
              <input
                type="date"
                value={draft.endsAt}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, endsAt: event.target.value }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>
          </div>

          <label className="block text-[10px] font-bold text-ink">
            Description
            <input
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="20% off your weekend order"
              className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
            />
          </label>

          <div>
            <p className="mb-1 text-[10px] font-bold text-ink">Discount type</p>
            <div className="grid grid-cols-2 gap-2">
              {(["percentage", "fixed"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({ ...current, type: value }))
                  }
                  className={cn(
                    "rounded-xl border py-2.5 text-[10px] font-bold capitalize transition",
                    draft.type === value
                      ? "border-brand bg-brand-soft/40 text-brand-dark"
                      : "border-line bg-white text-muted",
                  )}
                >
                  {value === "percentage" ? "Percentage off" : "Fixed amount"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="text-[10px] font-bold text-ink">
              {draft.type === "percentage" ? "Discount (%)" : "Discount (Ks)"}
              <input
                type="number"
                min={1}
                value={draft.value}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    value: Number(event.target.value),
                  }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>
            <label className="text-[10px] font-bold text-ink">
              Minimum order (Ks)
              <input
                type="number"
                min={0}
                value={draft.minOrder}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    minOrder: Number(event.target.value),
                  }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>
            {draft.type === "percentage" && (
              <label className="text-[10px] font-bold text-ink">
                Max discount (Ks)
                <input
                  type="number"
                  min={0}
                  value={draft.maxDiscount}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      maxDiscount: Number(event.target.value),
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
                />
              </label>
            )}
            <label className="text-[10px] font-bold text-ink">
              Usage limit
              <input
                type="number"
                min={1}
                value={draft.usageLimit}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    usageLimit: Number(event.target.value),
                  }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
              />
            </label>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-cream px-3 py-2.5">
            <div>
              <p className="text-[11px] font-bold">Campaign active</p>
              <p className="text-[9px] text-muted">
                Inactive codes cannot be applied at checkout.
              </p>
            </div>
            <Toggle
              checked={draft.isActive}
              onChange={(next) =>
                setDraft((current) => ({ ...current, isActive: next }))
              }
              label="Campaign active"
            />
          </div>

          <div className="rounded-2xl border border-dashed border-brand/30 bg-brand-soft/30 p-3 text-[9px] leading-relaxed text-muted">
            Preview:{" "}
            <span className="font-mono font-bold text-brand">
              {draft.code || "YOURCODE"}
            </span>{" "}
            —{" "}
            {draft.type === "percentage"
              ? `${draft.value}% off`
              : `${formatMMK(draft.value)} off`}{" "}
            orders over {formatMMK(draft.minOrder)}.
          </div>
        </div>
      </Modal>

      <p className="text-center text-[9px] text-muted/60">
        {promotions.length} campaigns · changes apply instantly to checkout
      </p>
    </div>
  );
}
