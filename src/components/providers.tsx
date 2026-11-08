import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { useAuthStore } from "@/lib/store/auth";
import { AUTO_ADVANCE_MS, useOrdersStore } from "@/lib/store/orders";
import { useAdminStore } from "@/lib/store/admin";
import { getSupabaseClient } from "@/lib/supabase";
import { LocationSync } from "@/components/location-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useAuthStore.getState().hydrateFromSupabase();
  }, []);

  useEffect(() => {
    const refresh = () => void useOrdersStore.getState().hydrate();
    const unsub = useAuthStore.subscribe(() => refresh());
    refresh();
    return unsub;
  }, []);

  useEffect(() => {
    void useAdminStore.getState().hydrate();
  }, []);

  // Drive deliveries globally, so an order keeps moving through
  // confirmed → preparing → on the way → delivered even when the customer
  // leaves the tracking page.
  useEffect(() => {
    const tick = () => {
      const { orders, advanceStatus } = useOrdersStore.getState();
      const user = useAuthStore.getState().user;
      if (!user) return;
      const now = Date.now();

      for (const order of orders) {
        if (!order.autoAdvance) continue;
        // Only the customer who owns the order can advance it through the
        // ownership-checked RPC. Admins see the update arrive via Realtime.
        if (order.userId !== user.id) continue;
        const delay = AUTO_ADVANCE_MS[order.status];
        if (!delay) continue;

        const lastEvent = order.events[order.events.length - 1];
        const since = now - new Date(lastEvent?.at ?? order.placedAt).getTime();
        if (since >= delay) void advanceStatus(order.id);
      }
    };

    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  // Keep admin data (reviews, promotions, users) in sync with Supabase.
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const refresh = () => void useAdminStore.getState().hydrate();
    const channel = supabase
      .channel("yumgo-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "promotions" },
        refresh,
      )
      .subscribe();

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Keep orders in sync with Supabase so dashboards reflect newly placed
  // orders without a manual reload.
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const refresh = () => void useOrdersStore.getState().hydrate();
    const channel = supabase
      .channel("yumgo-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        refresh,
      )
      .subscribe();

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <LocationSync />
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: "16px",
            fontFamily: "inherit",
          },
        }}
      />
    </>
  );
}

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
