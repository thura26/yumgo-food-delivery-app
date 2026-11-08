import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellOff, CheckCheck, ClipboardList, MessageSquareText, Package, Store, UtensilsCrossed } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { useAdminNotifications } from "@/lib/use-admin-notifications";

const iconFor = (kind: string) => {
  switch (kind) {
    case "order": return ClipboardList;
    case "review": return MessageSquareText;
    case "stock": return Package;
    case "setup": return UtensilsCrossed;
    default: return Store;
  }
};

const toneClass = (tone: string) => {
  switch (tone) {
    case "amber": return "bg-amber-50 text-amber-600";
    case "violet": return "bg-violet-50 text-violet-600";
    case "rose": return "bg-rose-50 text-rose-600";
    default: return "bg-brand-soft text-brand-dark";
  }
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAllRead, markRead } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible = notifications.slice(0, 8);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-muted transition hover:text-ink"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-[68px] z-50 max-h-[70vh] overflow-hidden rounded-2xl border border-line bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[360px]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-extrabold">Notifications</p>
              <p className="text-[9px] text-muted">
                {unreadCount > 0 ? `${unreadCount} unread` : "You&apos;re all caught up"}
              </p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[9px] font-bold text-muted transition hover:border-brand/30 hover:text-brand disabled:opacity-40"
            >
              <CheckCheck size={12} /> Mark all read
            </button>
          </div>

          <div className="max-h-[56vh] overflow-y-auto">
            {visible.length === 0 && (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <BellOff size={24} className="text-muted/50" />
                <p className="text-xs font-bold">No new alerts</p>
                <p className="text-[10px] text-muted">You&apos;re all caught up.</p>
              </div>
            )}
            {visible.map((n) => {
              const Icon = iconFor(n.kind);
              return (
                <Link
                  key={n.id}
                  to={n.href}
                  onClick={() => {
                    markRead([n.id]);
                    setOpen(false);
                  }}
                  className="flex items-start gap-3 border-b border-line/60 px-4 py-3 transition hover:bg-cream/60 last:border-0"
                >
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", toneClass(n.tone))}>
                    <Icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold">{n.title}</span>
                    <span className="block text-[9px] text-muted">{n.description}</span>
                    {n.at && (
                      <span className="block text-[8px] text-muted/70 mt-0.5">{timeAgo(n.at)}</span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}