import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useAddressStore } from "@/lib/store/addresses";

/**
 * Keeps the address store in sync with the signed-in account. New accounts are
 * sent to the location step by the signup and email-confirmation flows.
 * Rendered once from <Providers />.
 */
export function LocationSync() {
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((state) => state.user);
  const ownerId = useAddressStore((state) => state.ownerId);
  const syncStatus = useAddressStore((state) => state.syncStatus);
  const hydrateForOwner = useAddressStore((state) => state.hydrateForOwner);

  const userId = user?.id ?? null;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (ownerId === userId && syncStatus !== "idle") return;
    void hydrateForOwner(userId);
  }, [mounted, ownerId, userId, syncStatus, hydrateForOwner]);

  return null;
}
