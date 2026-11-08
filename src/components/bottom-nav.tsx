import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  ClipboardList,
  Heart,
  Home,
  ShoppingBag,
  TicketPercent,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrdersStore } from "@/lib/store/orders";
import { useAuthStore } from "@/lib/store/auth";
import { countActiveOrders, getOrdersForUser } from "@/lib/user-orders";
import { useMounted } from "@/components/providers";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/promos", label: "Promo", icon: TicketPercent },
  { href: "/profile", label: "Account", icon: UserRound },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const mounted = useMounted();
  const orders = useOrdersStore((state) => state.orders);
  const user = useAuthStore((state) => state.user);
  const activeOrders = mounted
    ? countActiveOrders(getOrdersForUser(orders, user))
    : 0;

  const badgeFor = (href: string) => {
    if (href === "/orders") return activeOrders;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid h-[68px] max-w-lg grid-cols-5 px-2">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const badge = mounted ? badgeFor(item.href) : 0;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors",
                active ? "text-brand-dark" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "relative flex h-8 w-10 items-center justify-center rounded-full transition-all",
                  active && "bg-brand-soft",
                )}
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.4 : 1.8}
                  fill={active && item.href === "/favorites" ? "currentColor" : "none"}
                />
                {badge > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] text-white">
                    {badge}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="mx-auto flex max-w-lg items-center justify-center gap-1 pb-1 text-[9px] text-muted/50">
        <ShoppingBag size={10} />
        YumGo — good food, closer to you
      </div>
    </nav>
  );
}
