import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Check,
  Home,
  Loader2,
  LocateFixed,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AddressPickerMap } from "@/components/maps/map-loaders";
import { useMounted } from "@/components/providers";
import { getActiveAddress, createAddressId, useAddressStore } from "@/lib/store/addresses";
import { useAuthStore } from "@/lib/store/auth";
import {
  geolocationErrorMessage,
  getCurrentPosition,
  reverseGeocode,
} from "@/lib/geo";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";

const emptyDraft = {
  label: "Home",
  line: "",
  township: "",
  city: "Yangon",
  phone: "",
};

export default function AddressesPage() {
  const mounted = useMounted();
  const addresses = useAddressStore((state) => state.addresses);
  const selectedId = useAddressStore((state) => state.selectedId);
  const addAddress = useAddressStore((state) => state.addAddress);
  const updateAddress = useAddressStore((state) => state.updateAddress);
  const removeAddress = useAddressStore((state) => state.removeAddress);
  const selectAddress = useAddressStore((state) => state.selectAddress);
  const setDefaultAddress = useAddressStore((state) => state.setDefaultAddress);
  const user = useAuthStore((state) => state.user);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [position, setPosition] = useState({ lat: 16.8505, lng: 96.1315 });
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const geocodeAbort = useRef<AbortController | null>(null);
  const lastGeocoded = useRef("");

  const editing = addresses.find((address) => address.id === editingId);

  useEffect(() => {
    if (!open || editingId) return;

    const key = `${position.lat.toFixed(6)},${position.lng.toFixed(6)}`;
    if (lastGeocoded.current === key) return;
    lastGeocoded.current = key;

    geocodeAbort.current?.abort();
    const controller = new AbortController();
    geocodeAbort.current = controller;

    const timer = setTimeout(async () => {
      setGeocoding(true);
      try {
        const result = await reverseGeocode(position, controller.signal);
        if (controller.signal.aborted) return;
        setDraft((current) => ({
          ...current,
          line: result.line || current.line,
          township: result.township || current.township,
          city: result.city || current.city,
        }));
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Manual entry fallback.
      } finally {
        if (!controller.signal.aborted) setGeocoding(false);
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [position, open, editingId]);

  useEffect(() => {
    return () => geocodeAbort.current?.abort();
  }, []);

  const openNew = () => {
    const active = getActiveAddress(addresses, selectedId);
    const lat = active?.lat ?? 16.8505;
    const lng = active?.lng ?? 96.1315;
    lastGeocoded.current = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    setEditingId(null);
    setDraft({
      ...emptyDraft,
      phone: user?.phone ?? active?.phone ?? "",
    });
    setPosition({ lat, lng });
    setOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditingId(address.id);
    setDraft({
      label: address.label,
      line: address.line,
      township: address.township,
      city: address.city,
      phone: address.phone,
    });
    setPosition({ lat: address.lat, lng: address.lng });
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEditingId(null);
  };

  const save = async () => {
    if (!draft.line.trim() || !draft.township.trim()) {
      toast.error("Please enter a street address and township.");
      return;
    }

    setSaving(true);

    if (editingId) {
      const saved = await updateAddress(editingId, {
        ...draft,
        lat: position.lat,
        lng: position.lng,
      });
      setSaving(false);
      if (!saved) {
        toast.error("Could not update the address. Please try again.");
        return;
      }
      toast.success("Address updated");
      close();
      return;
    }

    const synced = await addAddress({
      id: createAddressId(),
      ...draft,
      lat: position.lat,
      lng: position.lng,
      isDefault: addresses.length === 0,
    });
    setSaving(false);

    if (!synced) {
      toast.error("Could not save the address. Please try again.");
      return;
    }

    toast.success("Address added");
    close();
  };

  const locateMe = async () => {
    setLocating(true);
    try {
      const point = await getCurrentPosition();
      lastGeocoded.current = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
      setPosition(point);
      const result = await reverseGeocode(point);
      setDraft((current) => ({
        ...current,
        line: result.line || current.line,
        township: result.township || current.township,
        city: result.city || current.city,
      }));
      if (!result.line && !result.township) {
        toast("We found your pin — please confirm the street name.");
      }
    } catch (err) {
      toast.error(geolocationErrorMessage(err));
    } finally {
      setLocating(false);
    }
  };

  const makeDefault = async (id: string) => {
    const saved = await setDefaultAddress(id);
    if (!saved) {
      toast.error("Could not update the default address. Please try again.");
      return;
    }
    toast.success("Default address updated");
  };

  const handleDelete = async (address: Address) => {
    const removed = await removeAddress(address.id);
    if (!removed) {
      toast.error("Could not remove the address. Please try again.");
      return;
    }
    toast.success(`${address.label} address removed`);
  };

  if (!mounted) {
    return (
      <div className="px-4 py-6">
        <div className="skeleton h-8 w-40 rounded-full" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-28 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader
        title="My addresses"
        subtitle="Manage the places we deliver to."
        right={
          <button
            type="button"
            onClick={openNew}
            className="flex h-10 items-center gap-1 rounded-full bg-brand px-3.5 text-[11px] font-bold text-white shadow-soft transition hover:bg-brand-dark"
          >
            <Plus size={14} /> Add
          </button>
        }
      />

      <div className="mx-auto w-full max-w-4xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 rounded-3xl border border-brand/20 bg-brand-soft/40 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand shadow-sm">
            <MapPin size={20} />
          </span>
          <div>
            <p className="text-sm font-extrabold">
              {addresses.length} saved address{addresses.length === 1 ? "" : "es"}
            </p>
            <p className="mt-0.5 text-[10px] text-muted">
              Tap a card to make it your default delivery point.
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => {
            const active = address.id === selectedId;
            return (
              <article
                key={address.id}
                className={cn(
                  "relative rounded-3xl border bg-white p-4 shadow-card transition",
                  active ? "border-brand/40 ring-2 ring-brand/10" : "border-line",
                )}
              >
                <button
                  type="button"
                  onClick={() => selectAddress(address.id)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                      address.label.toLowerCase().includes("work")
                        ? "bg-blue-50 text-blue-600"
                        : "bg-brand-soft text-brand-dark",
                    )}
                  >
                    {address.label.toLowerCase().includes("work") ? (
                      <Building2 size={18} />
                    ) : (
                      <Home size={18} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-extrabold">{address.label}</span>
                      {address.isDefault && (
                        <span className="rounded-full bg-brand px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                          Default
                        </span>
                      )}
                      {active && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-600">
                          <Check size={8} /> Selected
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted">
                      {address.line}, {address.township}, {address.city}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted">
                      <Phone size={10} /> {address.phone}
                    </span>
                  </span>
                </button>

                <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-2.5">
                  <button
                    type="button"
                    onClick={() => makeDefault(address.id)}
                    disabled={address.isDefault}
                    className="text-[10px] font-bold text-brand disabled:text-muted/50"
                  >
                    {address.isDefault ? "Default address" : "Make default"}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(address)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-ink"
                      aria-label={`Edit ${address.label}`}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(address)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Delete ${address.label}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          <button
            type="button"
            onClick={openNew}
            className="flex min-h-[148px] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-brand/30 bg-white/50 p-4 text-brand transition hover:bg-brand-soft/30"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft">
              <Plus size={19} />
            </span>
            <span className="text-xs font-bold">Add a new address</span>
            <span className="text-[10px] text-muted">
              Drop a pin or type it manually
            </span>
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-white/70 p-3.5 text-[10px] leading-relaxed text-muted">
          <p className="font-bold text-ink">Saved to your account</p>
          <p className="mt-1">
            Your addresses are saved to your account and available on every
            device. Maps and reverse geocoding use OpenStreetMap / Nominatim.
          </p>
        </div>
      </div>

      <Modal
        open={open}
        onClose={close}
        title={editing ? "Edit address" : "Add a new address"}
        description="Tap the map or drag the pin to set your delivery point."
        className="sm:max-w-2xl"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={close}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={save} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving...
                </>
              ) : editing ? (
                "Save changes"
              ) : (
                "Save address"
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold text-muted">
              Drop a pin, or let your device find you.
            </p>
            <button
              type="button"
              onClick={locateMe}
              disabled={locating}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft/50 px-3 text-[10px] font-bold text-brand-dark transition hover:bg-brand-soft disabled:opacity-60"
            >
              {locating ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <LocateFixed size={13} />
              )}
              {locating ? "Finding you..." : "Use current location"}
            </button>
          </div>

          <AddressPickerMap
            value={position}
            onChange={(lat, lng) => setPosition({ lat, lng })}
            height={220}
          />
          <p className="text-[9px] text-muted">
            {geocoding
              ? "Looking up the address..."
              : "OpenStreetMap · tap anywhere to move the delivery pin."}
          </p>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="text-[10px] font-bold text-ink">
              Label
              <input
                value={draft.label}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, label: event.target.value }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
                placeholder="Home"
              />
            </label>
            <label className="text-[10px] font-bold text-ink">
              Phone
              <input
                value={draft.phone}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, phone: event.target.value }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
                placeholder="+95 9 ..."
              />
            </label>
          </div>

          <label className="block text-[10px] font-bold text-ink">
            Street address
            <input
              value={draft.line}
              onChange={(event) =>
                setDraft((current) => ({ ...current, line: event.target.value }))
              }
              className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
              placeholder="No. 12, Baho Road"
            />
          </label>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="text-[10px] font-bold text-ink">
              Township
              <input
                value={draft.township}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    township: event.target.value,
                  }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
                placeholder="Hlaing"
              />
            </label>
            <label className="text-[10px] font-bold text-ink">
              City
              <input
                value={draft.city}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, city: event.target.value }))
                }
                className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
                placeholder="Yangon"
              />
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
