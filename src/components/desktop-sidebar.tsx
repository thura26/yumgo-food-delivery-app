import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  ClipboardList,
  Heart,
  Home,
  LayoutDashboard,
  LogIn,
  ShoppingBag,
  Store,
  TicketPercent,
  UserRound,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Avatar } from "@/components/avatar";
import { useMounted } from "@/components/providers";
import { useAuthStore } from "@/lib/store/auth";
import {
  useCartStore,
  getCartCount,
  getCartSubtotal,
} from "@/lib/store/cart";
import { useOrdersStore } from "@/lib/store/orders";
import { countActiveOrders, getOrdersForUser } from "@/lib/user-orders";
import { cn, formatMMK } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/restaurants", label: "Restaurants", icon: Store },
  { href: "/orders", label: "My Orders", icon: ClipboardList },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/promos", label: "Promo", icon: TicketPercent },
  { href: "/profile", label: "Account", icon: UserRound },
];

export function DesktopSidebar() {
  const { pathname } = useLocation();
  const mounted = useMounted();
  const user = useAuthStore((state) => state.user);
  const restaurant = useCartStore((state) => state.restaurant);
  const lines = useCartStore((state) => state.lines);
  const orders = useOrdersStore((state) => state.orders);
  const count = mounted ? getCartCount(lines) : 0;
  const subtotal = mounted ? getCartSubtotal(lines) : 0;
  const activeOrders = mounted
    ? countActiveOrders(getOrdersForUser(orders, user))
    : 0;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-line bg-white/70 px-5 py-6 backdrop-blur-xl lg:flex">
      <Link to="/home" className="px-1">
        <BrandLogo size={42} />
      </Link>

      <nav className="mt-9 flex flex-col gap-1">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted/70">
          Discover
        </p>
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/restaurants" &&
              pathname.startsWith("/restaurants/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all",
                active
                  ? "bg-brand text-white shadow-soft"
                  : "text-muted hover:bg-cream hover:text-ink",
              )}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.4 : 1.9}
                className={active ? "text-white" : "text-muted group-hover:text-brand"}
              />
              {item.label}
              {item.href === "/orders" && activeOrders > 0 && (
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-[10px]",
                    active ? "bg-white/20" : "bg-cream text-muted",
                  )}
                >
                  {activeOrders}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-7 rounded-3xl border border-line bg-cream p-4">
        <div className="flex items-center justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-brand shadow-sm">
            <ShoppingBag size={17} />
          </span>
          {count > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
              {count} {count === 1 ? "item" : "items"}
            </span>
          )}
        </div>
        {count > 0 ? (
          <>
            <p className="mt-3 text-[11px] font-medium text-muted">
              {restaurant?.name}
            </p>
            <p className="mt-0.5 text-lg font-extrabold tracking-tight">
              {formatMMK(subtotal)}
            </p>
            <Link
              to="/cart"
              className="mt-3 flex h-9 w-full items-center justify-center rounded-full bg-brand text-xs font-bold text-white transition hover:bg-brand-dark"
            >
              View cart
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-bold">Your cart is empty</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Add something delicious from a nearby restaurant.
            </p>
            <Link
              to="/restaurants"
              className="mt-3 flex h-9 w-full items-center justify-center rounded-full border border-line bg-white text-xs font-bold text-ink transition hover:border-brand/30"
            >
              Browse restaurants
            </Link>
          </>
        )}
      </div>

      <div className="mt-auto pt-6">
        {user?.role === "admin" && (
          <Link
            to="/admin"
            className="mb-2 flex items-center gap-3 rounded-2xl border border-dashed border-brand/30 bg-brand-soft/40 px-3 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-soft"
          >
            <LayoutDashboard size={17} />
            Admin dashboard
          </Link>
        )}
        {mounted && user ? (
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-cream"
          >
            <Avatar name={user.name} color={user.avatarColor} size={38} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">
                {user.name}
              </span>
              <span className="block truncate text-[11px] text-muted">
                {user.email}
              </span>
            </span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold transition hover:border-brand/30"
          >
            <LogIn size={17} className="text-brand" />
            Sign in
          </Link>
        )}
        <p className="mt-4 px-2 text-[10px] text-muted/60">
          YumGo · v1.0
        </p>
      </div>
    </aside>
  );
}
