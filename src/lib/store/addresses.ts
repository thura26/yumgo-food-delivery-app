import { create } from "zustand";
import type { Address } from "@/lib/types";
import {
  deleteRemoteAddress,
  fetchRemoteAddresses,
  setRemoteDefaultAddress,
  updateRemoteAddress,
  upsertRemoteAddress,
} from "@/lib/addresses-db";

type SyncStatus = "idle" | "loading" | "ready";

type AddressState = {
  ownerId: string | null;
  addresses: Address[];
  selectedId: string;
  syncStatus: SyncStatus;
  hydrateForOwner: (ownerId: string | null) => Promise<void>;
  addAddress: (address: Address) => Promise<boolean>;
  removeAddress: (id: string) => Promise<boolean>;
  selectAddress: (id: string) => void;
  updateAddress: (id: string, patch: Partial<Address>) => Promise<boolean>;
  setDefaultAddress: (id: string) => Promise<boolean>;
};

export function createAddressId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `addr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getActiveAddress(
  addresses: Address[],
  selectedId: string,
): Address | undefined {
  return (
    addresses.find((address) => address.id === selectedId) ??
    addresses.find((address) => address.isDefault) ??
    addresses[0]
  );
}

// Guards against an older Supabase fetch landing after an account switch.
let syncToken = 0;

export const useAddressStore = create<AddressState>()((set, get) => ({
  ownerId: null,
  addresses: [],
  selectedId: "",
  syncStatus: "idle",

  hydrateForOwner: async (ownerId) => {
    if (get().ownerId === ownerId && get().syncStatus === "ready") return;

    const token = ++syncToken;

    if (!ownerId) {
      set({
        ownerId: null,
        addresses: [],
        selectedId: "",
        syncStatus: "ready",
      });
      return;
    }

    set({ ownerId, syncStatus: "loading" });
    const result = await fetchRemoteAddresses(ownerId);
    if (token !== syncToken) return;

    if (!result.ok) {
      set({ addresses: [], selectedId: "", syncStatus: "ready" });
      return;
    }

    const selectedId =
      result.addresses.find((address) => address.isDefault)?.id ??
      result.addresses[0]?.id ??
      "";
    set({ addresses: result.addresses, selectedId, syncStatus: "ready" });
  },

  addAddress: async (address) => {
    const ownerId = get().ownerId;
    if (!ownerId) return false;

    const saved = await upsertRemoteAddress(ownerId, address);
    if (!saved) return false;

    const existing = get().addresses;
    const base = address.isDefault
      ? existing.map((item) => ({ ...item, isDefault: false }))
      : existing;

    set({ addresses: [...base, address], selectedId: address.id });
    return true;
  },

  removeAddress: async (id) => {
    const ownerId = get().ownerId;
    if (!ownerId) return false;

    const current = get().addresses;
    const removed = current.find((address) => address.id === id);
    const remaining = current.filter((address) => address.id !== id);

    if (removed?.isDefault && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }

    const deleted = await deleteRemoteAddress(ownerId, id);
    if (!deleted) return false;

    if (removed?.isDefault && remaining[0]) {
      await setRemoteDefaultAddress(ownerId, remaining[0].id);
    }

    set({
      addresses: remaining,
      selectedId:
        get().selectedId === id ? (remaining[0]?.id ?? "") : get().selectedId,
    });
    return true;
  },

  selectAddress: (id) => set({ selectedId: id }),

  updateAddress: async (id, patch) => {
    const ownerId = get().ownerId;
    if (!ownerId) return false;

    const saved = await updateRemoteAddress(ownerId, id, patch);
    if (!saved) return false;

    set({
      addresses: get().addresses.map((address) => {
        if (address.id === id) return { ...address, ...patch };
        return patch.isDefault ? { ...address, isDefault: false } : address;
      }),
    });
    return true;
  },

  setDefaultAddress: async (id) => {
    const ownerId = get().ownerId;
    if (!ownerId) return false;

    const saved = await setRemoteDefaultAddress(ownerId, id);
    if (!saved) return false;

    set({
      addresses: get().addresses.map((address) => ({
        ...address,
        isDefault: address.id === id,
      })),
      selectedId: id,
    });
    return true;
  },
}));
