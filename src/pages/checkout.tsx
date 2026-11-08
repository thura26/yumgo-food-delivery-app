import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bike,
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
  LocateFixed,
  MapPin,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AddressPickerMap } from "@/components/maps/map-loaders";
import { useCartStore, getCartSubtotal } from "@/lib/store/cart";
import {
  createAddressId,
  getActiveAddress,
  useAddressStore,
} from "@/lib/store/addresses";
import { useAuthStore } from "@/lib/store/auth";
import { useOrdersStore } from "@/lib/store/orders";
import { useAdminStore } from "@/lib/store/admin";
import { useMounted } from "@/components/providers";
import { useCatalog } from "@/lib/use-catalog";
import {
  geolocationErrorMessage,
  getCurrentPosition,
  reverseGeocode,
} from "@/lib/geo";
import type { Address, Driver, Order } from "@/lib/types";
import {
  calculateDiscount,
  cn,
  formatMMK,
  generateOrderCode,
} from "@/lib/utils";

const driverPool: Driver[] = [
  { name: "Budi Santoso", phone: "+95 9 111 222 333", plate: "YGN 7A-1234", rating: 4.9, avatarColor: "#00B14F" },
  { name: "Zaw Min", phone: "+95 9 222 333 444", plate: "YGN 3B-5678", rating: 4.8, avatarColor: "#2F9E63" },
  { name: "Ko Thet", phone: "+95 9 333 444 555", plate: "YGN 9C-9012", rating: 4.7, avatarColor: "#3B82F6" },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const mounted = useMounted();
  const catalog = useCatalog();
  const cartRestaurant = useCartStore((state) => state.restaurant);
  const lines = useCartStore((state) => state.lines);
  const notes = useCartStore((state) => state.notes);
  const promoCode = useCartStore((state) => state.promoCode);
  const clearCart = useCartStore((state) => state.clear);
  const addresses = useAddressStore((state) => state.addresses);
  const selectedId = useAddressStore((state) => state.selectedId);
  const selectAddress = useAddressStore((state) => state.selectAddress);
  const addAddress = useAddressStore((state) => state.addAddress);
  const user = useAuthStore((state) => state.user);
  const authHydrated = useAuthStore((state) => state.authHydrated);
  const addOrder = useOrdersStore((state) => state.addOrder);
  const promotions = useAdminStore((state) => state.promotions);
  const [addressModal, setAddressModal] = useState(false);
  const [newAddressMode, setNewAddressMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [draft, setDraft] = useState({
    label: "Home",
    line: "",
    township: "",
    city: "Yangon",
    phone: "",
  });
  const [draftPosition, setDraftPosition] = useState({
    lat: 16.8505,
    lng: 96.1315,
  });
  const [locating, setLocating] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const geocodeAbort = useRef<AbortController | null>(null);
  const lastGeocoded = useRef("");

  const selectedAddress = getActiveAddress(addresses, selectedId);

  const subtotal = getCartSubtotal(lines);
  const deliveryFee = cartRestaurant?.deliveryFee ?? 0;
  const serviceFee = lines.length ? 1000 : 0;
  const promo = promotions.find(
    (item) => item.code.toLowerCase() === (promoCode ?? "").toLowerCase(),
  );
  const discount = calculateDiscount(promo, subtotal);
  const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);

  useEffect(() => {
    if (!mounted) return;
    if (!lines.length && !processing) {
      navigate("/cart", { replace: true });
    }
  }, [mounted, lines.length, processing, navigate]);

  useEffect(() => {
    if (!mounted || !authHydrated) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent("/checkout")}`, {
        replace: true,
      });
    }
  }, [mounted, authHydrated, user, navigate]);

  useEffect(() => {
    if (!newAddressMode) return;

    const key = `${draftPosition.lat.toFixed(6)},${draftPosition.lng.toFixed(6)}`;
    if (lastGeocoded.current === key) return;
    lastGeocoded.current = key;

    geocodeAbort.current?.abort();
    const controller = new AbortController();
    geocodeAbort.current = controller;

    const timer = setTimeout(async () => {
      try {
        const result = await reverseGeocode(draftPosition, controller.signal);
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
        // Silent fallback: the user can type the address manually.
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [draftPosition, newAddressMode]);

  useEffect(() => {
    return () => geocodeAbort.current?.abort();
  }, []);

  const openNewAddress = () => {
    const lat = selectedAddress?.lat ?? 16.8505;
    const lng = selectedAddress?.lng ?? 96.1315;
    lastGeocoded.current = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    setDraft({
      label: "Home",
      line: "",
      township: "",
      city: "Yangon",
      phone: selectedAddress?.phone ?? user?.phone ?? "",
    });
    setDraftPosition({ lat, lng });
    setNewAddressMode(true);
  };

  const locateMe = async () => {
    setLocating(true);
    try {
      const point = await getCurrentPosition();
      lastGeocoded.current = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
      setDraftPosition(point);
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

  const saveAddress = async () => {
    if (!draft.line.trim() || !draft.township.trim()) {
      toast.error("Please add a street address and township.");
      return;
    }
    const address: Address = {
      id: createAddressId(),
      label: draft.label || "Home",
      line: draft.line,
      township: draft.township,
      city: draft.city || "Yangon",
      lat: draftPosition.lat,
      lng: draftPosition.lng,
      phone: draft.phone || user?.phone || "+95 9 000 000 000",
      isDefault: addresses.length === 0,
    };

    setSavingAddress(true);
    const synced = await addAddress(address);
    setSavingAddress(false);

    if (!synced) {
      toast.error("Could not save the address. Please try again.");
      return;
    }

    setAddressModal(false);
    setNewAddressMode(false);
    toast.success("Delivery address saved");
  };

  const placeOrder = async () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent("/checkout")}`, {
        replace: true,
      });
      return;
    }
    if (!selectedAddress) {
      toast.error("Please add a delivery address.");
      setAddressModal(true);
      return;
    }
    if (!cartRestaurant || !lines.length) {
      toast.error("Your cart is empty.");
      return;
    }

    setProcessing(true);
    const restaurant = catalog.find((r) => r.id === cartRestaurant.id);
    const now = new Date().toISOString();
    const driver = driverPool[Math.floor(Math.random() * driverPool.length)];
    const order: Order = {
      id: crypto.randomUUID(),
      code: generateOrderCode(),
      userId: user.id,
      userEmail: user.email,
      customerName: user.name,
      customerPhone: selectedAddress.phone,
      restaurantId: cartRestaurant.id,
      restaurantName: cartRestaurant.name,
      restaurantImage: cartRestaurant.image,
      restaurantTownship: restaurant?.township ?? "Yangon",
      items: lines,
      subtotal,
      deliveryFee,
      serviceFee,
      discount,
      total,
      status: "confirmed",
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      address: `${selectedAddress.line}, ${selectedAddress.township}, ${selectedAddress.city}`,
      lat: selectedAddress.lat,
      lng: selectedAddress.lng,
      notes,
      placedAt: now,
      driver,
      events: [{ status: "confirmed", at: now }],
      autoAdvance: true,
    };

    const saved = await addOrder(order);
    if (!saved) {
      setProcessing(false);
      toast.error("We could not place your order. Please try again.");
      return;
    }

    clearCart();
    toast.success("Order placed — pay on delivery");

    setTimeout(() => {
      navigate(`/orders/${order.id}/success`, { replace: true });
    }, 900);
  };

  if (!mounted) {
    return (
      <div className="px-4 py-6">
        <div className="skeleton h-10 w-40 rounded-full" />
        <div className="mt-4 skeleton h-72 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="pb-28 lg:pb-10">
      <PageHeader
        title="Checkout"
        subtitle={
          cartRestaurant ? `Order from ${cartRestaurant.name}` : "Review your order"
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold text-muted">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
            1
          </span>
          Address
          <span className="h-px flex-1 bg-line" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
            2
          </span>
          Payment
          <span className="h-px flex-1 bg-line" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-line text-muted">
            3
          </span>
          Tracking
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_370px] lg:items-start">
          <div className="space-y-3">
            <section className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
                    <MapPin size={17} />
                  </span>
                  <div>
                    <h2 className="text-sm font-extrabold">Delivery address</h2>
                    <p className="text-[10px] text-muted">
                      Where should we bring your food?
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddressModal(true)}
                  className="text-[10px] font-bold text-brand"
                >
                  Change
                </button>
              </div>

              {selectedAddress ? (
                <div className="mt-3 rounded-2xl border border-line bg-cream/60 p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand">
                      {selectedAddress.label}
                    </span>
                    {selectedAddress.isDefault && (
                      <span className="text-[9px] font-semibold text-muted">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs font-bold">
                    {selectedAddress.line}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {selectedAddress.township}, {selectedAddress.city}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    {selectedAddress.phone}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddressModal(true)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand/40 bg-brand-soft/30 py-4 text-xs font-bold text-brand"
                >
                  <Plus size={15} /> Add a delivery address
                </button>
              )}

            </section>

            <section className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
                  <Banknote size={17} />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold">Payment method</h2>
                  <p className="text-[10px] text-muted">
                    Pay the rider when your food arrives.
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-brand bg-brand-soft/40 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2F9E63] text-white">
                  <Banknote size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">Cash on Delivery</span>
                    <span className="rounded-full bg-brand px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                      Only option
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted">
                    Prepare {formatMMK(total)} in cash for the rider.
                  </span>
                </span>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-[9px] text-muted/70">
                <ShieldCheck size={12} />
                No card details are collected or stored
              </div>
            </section>

            <section className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5">
              <h2 className="text-sm font-extrabold">Order details</h2>
              <div className="mt-2.5 space-y-2">
                {lines.map((line) => (
                  <div
                    key={line.itemId}
                    className="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="min-w-0 truncate text-muted">
                      {line.qty} × {line.name}
                    </span>
                    <span className="shrink-0 font-semibold">
                      {formatMMK(line.price * line.qty)}
                    </span>
                  </div>
                ))}
              </div>
              {notes && (
                <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-[10px] italic text-muted">
                  “{notes}”
                </p>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
                  <CreditCard size={17} />
                </span>
                <div>
                  <p className="text-sm font-extrabold">Payment summary</p>
                  <p className="text-[10px] text-muted">
                    {lines.reduce((sum, line) => sum + line.qty, 0)} items
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink">
                    {formatMMK(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Delivery</span>
                  <span className="font-semibold text-ink">
                    {formatMMK(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Service fee</span>
                  <span className="font-semibold text-ink">
                    {formatMMK(serviceFee)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Promo ({promo?.code})</span>
                    <span className="font-semibold">− {formatMMK(discount)}</span>
                  </div>
                )}
                <div className="my-2 h-px bg-line" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold">Total</span>
                  <span className="text-xl font-extrabold tracking-tight text-brand">
                    {formatMMK(total)}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="mt-5 hidden w-full lg:flex"
                onClick={placeOrder}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 size={17} className="animate-spin" /> Placing
                    order...
                  </>
                ) : (
                  <>
                    Place order <ArrowRight size={17} />
                  </>
                )}
              </Button>

              <div className="mt-3 rounded-2xl bg-cream p-3 text-[10px] leading-relaxed text-muted">
                <p className="flex items-center gap-1.5 font-bold text-ink">
                  <Bike size={13} className="text-brand" /> Arrives in 20–30 min
                </p>
                <p className="mt-1">
                  Your rider will be assigned as soon as the restaurant confirms
                  your order.
                </p>
              </div>
            </div>

            <Link
              to="/cart"
              className="mt-3 flex h-11 items-center justify-center gap-1 rounded-2xl border border-dashed border-line bg-white/60 text-[11px] font-bold text-muted transition hover:border-brand/30 hover:text-brand"
            >
              <ChevronRight size={14} className="rotate-180" /> Back to cart
            </Link>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white/95 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
              Total
            </p>
            <p className="text-lg font-extrabold tracking-tight text-brand">
              {formatMMK(total)}
            </p>
          </div>
          <Button
            size="lg"
            className="ml-auto flex-1"
            onClick={placeOrder}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Placing order...
              </>
            ) : (
              "Place order"
            )}
          </Button>
        </div>
      </div>

      <Modal
        open={addressModal}
        onClose={() => {
          setAddressModal(false);
          setNewAddressMode(false);
        }}
        title="Delivery address"
        description="Choose a saved address or drop a new pin on the map."
        className="sm:max-w-2xl"
      >
        <div className="px-5 py-4 sm:px-6">
          {!newAddressMode ? (
            <div className="space-y-2.5">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  onClick={() => {
                    selectAddress(address.id);
                    setAddressModal(false);
                    toast.success(`${address.label} address selected`);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition",
                    address.id === selectedId
                      ? "border-brand bg-brand-soft/30"
                      : "border-line hover:border-brand/30",
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream text-brand">
                    <MapPin size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-bold">{address.label}</span>
                      {address.isDefault && (
                        <span className="rounded-full bg-brand px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted">
                      {address.line}, {address.township}, {address.city}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted">
                      {address.phone}
                    </span>
                  </span>
                  {address.id === selectedId && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={openNewAddress}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand/40 bg-brand-soft/30 py-3 text-xs font-bold text-brand"
              >
                <Plus size={15} /> Add a new address
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] font-semibold text-muted">
                  Tap the map or drag the pin.
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
                value={draftPosition}
                onChange={(lat, lng) => setDraftPosition({ lat, lng })}
                height={230}
              />
              <p className="text-[9px] text-muted">
                Search results are powered by OpenStreetMap. You can edit every
                field before saving.
              </p>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <label className="text-[10px] font-bold text-ink">
                  Label
                  <input
                    value={draft.label}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        label: event.target.value,
                      }))
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
                      setDraft((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
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
                    setDraft((current) => ({
                      ...current,
                      line: event.target.value,
                    }))
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
                      setDraft((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
                    placeholder="Yangon"
                  />
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setNewAddressMode(false)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={saveAddress}
                  disabled={savingAddress}
                >
                  {savingAddress ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save address"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {processing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-6 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-3xl bg-white p-7 text-center shadow-2xl">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand-dark animate-pulse-ring">
              <Banknote size={28} />
            </span>
            <h3 className="mt-4 text-base font-extrabold">
              Placing your order...
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              We are sending your order to the restaurant.
            </p>
            <Loader2 size={20} className="mx-auto mt-4 animate-spin text-brand" />
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-600">
              <BadgeCheck size={11} /> Cash on Delivery
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
