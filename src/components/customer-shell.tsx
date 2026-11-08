import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { CartDock, CartSpacer } from "@/components/cart-dock";
import { CartDrawer } from "@/components/cart-drawer";
import { CartReplaceDialog } from "@/components/cart-replace-dialog";

const NAV_ROUTES = [
  "/home",
  "/restaurants",
  "/orders",
  "/favorites",
  "/promos",
  "/profile",
];

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const showNav = NAV_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen bg-cream">
      <DesktopSidebar />
      <main className={cn("min-h-screen lg:pl-[260px]")}>
        <div className="mx-auto w-full max-w-[1320px]">{children}</div>
        <CartSpacer showNav={showNav} />
      </main>
      {showNav && <BottomNav />}
      <CartDock raised={showNav} />
      <CartDrawer />
      <CartReplaceDialog />
    </div>
  );
}
