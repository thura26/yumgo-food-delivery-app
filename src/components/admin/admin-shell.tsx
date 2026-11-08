import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Store,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { Avatar } from "@/components/avatar";
import { useMounted } from "@/components/providers";
import { useAuthStore } from "@/lib/store/auth";
import { useOrdersStore } from "@/lib/store/orders";
import { NotificationCenter } from "@/components/admin/notification-center";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/restaurants", label: "Restaurants", icon: Store },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/promotions", label: "Promotions", icon: TicketPercent },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/admin": {
    title: "Dashboard",
    subtitle: "A snapshot of how YumGo is performing today.",
  },
  "/admin/orders": {
    title: "Orders",
    subtitle: "Track, update and manage every delivery.",
  },
  "/admin/restaurants": {
    title: "Restaurants & menus",
    subtitle: "Control availability, pricing and menu items.",
  },
  "/admin/users": {
    title: "Users",
    subtitle: "Manage customers, admins and account access.",
  },
  "/admin/analytics": {
    title: "Analytics",
    subtitle: "Revenue, order volume and customer trends.",
  },
  "/admin/promotions": {
    title: "Promotions",
    subtitle: "Create and monitor voucher campaigns.",
  },
  "/admin/reviews": {
    title: "Reviews",
    subtitle: "Moderate customer feedback and ratings.",
  },
};

function AdminGate() {
  const user = useAuthStore((state) => state.user);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandLogo size={48} />
        </div>
        <div className="relative overflow-hidden rounded-[32px] border border-line bg-white p-6 shadow-soft sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand/10 blur-2xl" />
          <div className="relative text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white">
              <LayoutDashboard size={25} />
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.04em]">
              Admin access
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {user
                ? "This account does not have permission to open the YumGo operations dashboard."
                : "Sign in with an administrator account to open the YumGo operations dashboard."}
            </p>
          </div>

          {user ? (
            <Link
              to="/home"
              className="mt-5 flex h-11 items-center justify-center gap-1 rounded-full border border-line bg-white text-sm font-bold transition hover:border-brand/30"
            >
              <ArrowLeft size={13} /> Back to the customer app
            </Link>
          ) : (
            <Link
              to="/login?next=/admin"
              className="mt-5 flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              <LogIn size={16} /> Sign in
            </Link>
          )}
        </div>
        <p className="mt-4 text-center text-[10px] text-muted/70">
          YumGo operations · access is restricted to administrators
        </p>
      </div>
    </main>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mounted = useMounted();
  const user = useAuthStore((state) => state.user);
  const authHydrated = useAuthStore((state) => state.authHydrated);
  const logout = useAuthStore((state) => state.logout);
  const orders = useOrdersStore((state) => state.orders);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeOrders = orders.filter((order) =>
    ["confirmed", "preparing", "on_the_way"].includes(order.status),
  ).length;
  const pageMeta =
    pageTitles[pathname] ??
    (pathname.startsWith("/admin/orders")
      ? pageTitles["/admin/orders"]
      : { title: "Admin", subtitle: "YumGo operations" });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Keep admin views (dashboard, orders, analytics) in sync with the database.
  useEffect(() => {
    if (!user || user.role !== "admin") return;
    const refresh = () => void useOrdersStore.getState().hydrate();
    refresh();
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user]);

  if (!mounted || !authHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <AdminGate />;
  }

  const handleLogout = async () => {
    await logout();
    toast("Signed out of the admin dashboard");
    navigate("/login");
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-1">
        <Link to="/admin">
          <BrandLogo size={38} />
        </Link>
        <span className="rounded-full bg-ink px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-white">
          Admin
        </span>
      </div>

      <nav className="mt-7 flex flex-col gap-1">
        <p className="mb-1 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-muted/70">
          Operations
        </p>
        {navItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all",
                active
                  ? "bg-ink text-white shadow-md"
                  : "text-muted hover:bg-cream hover:text-ink",
              )}
            >
              <Icon
                size={17}
                strokeWidth={active ? 2.3 : 1.9}
                className={active ? "text-brand" : "text-muted group-hover:text-brand"}
              />
              {item.label}
              {item.href === "/admin/orders" && activeOrders > 0 && (
                <span
                  className={cn(
                    "ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                    active ? "bg-brand text-white" : "bg-brand-soft text-brand-dark",
                  )}
                >
                  {activeOrders}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 pt-6">
        <div className="rounded-2xl border border-dashed border-brand/30 bg-brand-soft/40 p-3">
          <p className="text-[10px] font-bold text-brand">Operations workspace</p>
          <p className="mt-1 text-[9px] leading-relaxed text-muted">
            Orders, menus, users and promotions are synced with Supabase in real
            time.
          </p>
        </div>
        <Link
          to="/home"
          className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2.5 text-[11px] font-semibold text-muted transition hover:border-brand/30 hover:text-ink"
        >
          <ArrowLeft size={14} /> Customer app
        </Link>
        <div className="flex items-center gap-2.5 rounded-2xl bg-cream px-2.5 py-2">
          <Avatar name={user.name} color={user.avatarColor} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold">{user.name}</p>
            <p className="truncate text-[9px] text-muted">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-rose-50 hover:text-rose-600"
            aria-label="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-line bg-white/80 px-4 py-5 backdrop-blur-xl lg:block">
        {SidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-white px-4 py-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-cream text-muted"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-line bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand">
                YumGo admin
              </p>
              <h1 className="mt-0.5 truncate text-lg font-extrabold tracking-tight sm:text-xl">
                {pageMeta.title}
              </h1>
              <p className="hidden truncate text-[10px] text-muted sm:block">
                {pageMeta.subtitle}
              </p>
            </div>

            <div className="hidden h-10 w-56 items-center gap-2 rounded-full border border-line bg-cream/60 px-3 text-xs text-muted xl:flex">
              <Search size={15} />
              <input
                placeholder="Quick search..."
                className="h-full w-full bg-transparent text-[11px] outline-none placeholder:text-muted/60"
              />
              <kbd className="rounded border border-line bg-white px-1.5 py-0.5 text-[8px] font-semibold text-muted">
                ⌘K
              </kbd>
            </div>

            <NotificationCenter />
            <Avatar name={user.name} color={user.avatarColor} size={36} />
          </div>
        </header>

        <main className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
