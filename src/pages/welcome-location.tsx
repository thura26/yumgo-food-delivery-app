import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  Loader2,
  LocateFixed,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { AddressPickerMap } from "@/components/maps/map-loaders";
import { useMounted } from "@/components/providers";
import { useAuthStore } from "@/lib/store/auth";
import { createAddressId, useAddressStore } from "@/lib/store/addresses";
import {
  geolocationErrorMessage,
  getCurrentPosition,
  reverseGeocode,
  type GeoPoint,
} from "@/lib/geo";
import type { Address } from "@/lib/types";

const YANGON_CENTER: GeoPoint = { lat: 16.8505, lng: 96.1315 };

const emptyDraft = {
  label: "Home",
  line: "",
  township: "",
  city: "Yangon",
  phone: "",
};

export default function WelcomeLocationPage() {
  const navigate = useNavigate();
  const mounted = useMounted();

  const user = useAuthStore((state) => state.user);
  const authHydrated = useAuthStore((state) => state.authHydrated);

  const ownerId = useAddressStore((state) => state.ownerId);
  const syncStatus = useAddressStore((state) => state.syncStatus);
  const addresses = useAddressStore((state) => state.addresses);
  const addAddress = useAddressStore((state) => state.addAddress);

  const [draft, setDraft] = useState(emptyDraft);
  const [position, setPosition] = useState<GeoPoint>(YANGON_CENTER);
  const [showManual, setShowManual] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const geocodeAbort = useRef<AbortController | null>(null);
  const phonePrefilled = useRef(false);

  const accountReady =
    mounted &&
    authHydrated &&
    Boolean(user) &&
    ownerId === user?.id &&
    syncStatus === "ready";

  const hasAddresses = accountReady && addresses.length > 0;

  useEffect(() => {
    if (!mounted || !authHydrated) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (ownerId !== user.id || syncStatus !== "ready") return;
    if (addresses.length > 0) {
      navigate("/home", { replace: true });
    }
  }, [
    mounted,
    authHydrated,
    user,
    ownerId,
    syncStatus,
    addresses.length,
    navigate,
  ]);

  useEffect(() => {
    if (!user || phonePrefilled.current) return;
    phonePrefilled.current = true;
    setDraft((current) => ({
      ...current,
      phone: current.phone || user.phone,
    }));
  }, [user]);

  useEffect(() => {
    return () => geocodeAbort.current?.abort();
  }, []);

  const fillFromPoint = useCallback(async (point: GeoPoint) => {
    geocodeAbort.current?.abort();
    const controller = new AbortController();
    geocodeAbort.current = controller;

    setGeocoding(true);
    setError("");

    try {
      const result = await reverseGeocode(point, controller.signal);
      if (controller.signal.aborted) return;

      setDraft((current) => ({
        ...current,
        line: result.line || current.line,
        township: result.township || current.township,
        city: result.city || current.city || "Yangon",
      }));

      if (!result.line && !result.township && !result.city) {
        setError(
          "We found your pin but could not read the street name. Please fill it in below.",
        );
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(
        "We could not look up that address. Check your connection or type it manually.",
      );
    } finally {
      if (!controller.signal.aborted) setGeocoding(false);
    }
  }, []);

  const locateMe = async () => {
    setShowManual(true);
    setLocating(true);
    setError("");

    try {
      const point = await getCurrentPosition();
      setPosition(point);
      await fillFromPoint(point);
    } catch (err) {
      setError(geolocationErrorMessage(err));
    } finally {
      setLocating(false);
    }
  };

  const handleMapChange = (lat: number, lng: number) => {
    const point = { lat, lng };
    setPosition(point);
    void fillFromPoint(point);
  };

  const skip = () => {
    navigate("/home", { replace: true });
  };

  const save = async () => {
    if (!user) return;

    const line = draft.line.trim();
    const township = draft.township.trim();

    if (!line || !township) {
      setError("Please add a street address and township.");
      return;
    }

    setSaving(true);
    setError("");

    const address: Address = {
      id: createAddressId(),
      label: draft.label.trim() || "Home",
      line,
      township,
      city: draft.city.trim() || "Yangon",
      lat: position.lat,
      lng: position.lng,
      phone: draft.phone.trim() || user.phone,
      isDefault: true,
    };

    const synced = await addAddress(address);
    setSaving(false);

    if (synced) {
      toast.success("Home address saved");
    } else {
      toast.error("Could not save your address. Please try again.");
    }

    navigate("/home", { replace: true });
  };

  if (!accountReady || hasAddresses) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6">
        <div className="w-full max-w-sm text-center">
          <BrandLogo size={44} className="justify-center" />
          <Loader2
            size={22}
            className="mx-auto mt-6 animate-spin text-brand"
            aria-label="Loading your account"
          />
          <p className="mt-3 text-xs text-muted">
            {hasAddresses ? "Taking you home..." : "Preparing your delivery area..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-cream">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#7FE3AA]/20 blur-3xl" />

      <header className="relative mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" aria-label="YumGo home">
          <BrandLogo size={40} />
        </Link>
        <button
          type="button"
          onClick={skip}
          className="rounded-full border border-line bg-white/80 px-4 py-2 text-[11px] font-semibold text-muted backdrop-blur transition hover:text-ink"
        >
          Skip for now
        </button>
      </header>

      <div className="relative mx-auto w-full max-w-3xl px-5 pb-10 pt-2 sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-dark">
          <MapPin size={12} />
          One last step
        </span>

        <h1 className="mt-4 max-w-xl text-[34px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[46px]">
          Where should we
          <br />
          <span className="text-brand">deliver your food?</span>
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
          Share your location once and we will save it as your home address.
          Every restaurant, delivery fee and rider ETA will then be measured
          from your door.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className="group flex items-center gap-3 rounded-3xl border border-brand/25 bg-white p-4 text-left shadow-card transition hover:border-brand/50 hover:shadow-soft disabled:opacity-70"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-soft">
              {locating ? (
                <Loader2 size={21} className="animate-spin" />
              ) : (
                <LocateFixed size={21} />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold">
                {locating ? "Finding you..." : "Use my current location"}
              </span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                Fastest — we will fill your street and township.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="group flex items-center gap-3 rounded-3xl border border-line bg-white/80 p-4 text-left transition hover:border-brand/30 hover:bg-white"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
              <Home size={21} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold">
                Enter it manually
              </span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                Drop a pin on the map or type your address.
              </span>
            </span>
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-[11px] font-medium leading-relaxed text-amber-700"
          >
            {error}
          </p>
        )}

        {showManual && (
          <section className="mt-5 rounded-[28px] border border-line bg-white p-4 shadow-card sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold">Confirm your home</p>
                <p className="mt-0.5 text-[10px] text-muted">
                  Tap the map or drag the pin to adjust the exact spot.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[9px] font-bold text-brand-dark">
                {geocoding ? (
                  <>
                    <Loader2 size={10} className="animate-spin" /> Looking up
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={10} /> OpenStreetMap
                  </>
                )}
              </span>
            </div>

            <div className="mt-3">
              <AddressPickerMap
                value={position}
                onChange={handleMapChange}
                height={230}
              />
            </div>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
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
                  className="mt-1 h-11 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
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
                  className="mt-1 h-11 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
                  placeholder="+95 9 ..."
                />
              </label>
            </div>

            <label className="mt-2.5 block text-[10px] font-bold text-ink">
              Street address
              <input
                value={draft.line}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    line: event.target.value,
                  }))
                }
                className="mt-1 h-11 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
                placeholder="No. 12, Baho Road"
              />
            </label>

            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
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
                  className="mt-1 h-11 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
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
                  className="mt-1 h-11 w-full rounded-xl border border-line bg-cream/60 px-3 text-xs font-medium outline-none focus:border-brand/40 focus:bg-white"
                  placeholder="Yangon"
                />
              </label>
            </div>

            <Button
              size="lg"
              className="mt-4 w-full"
              onClick={save}
              disabled={saving || geocoding}
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Saving your home...
                </>
              ) : (
                <>
                  Save home & start ordering <ArrowRight size={17} />
                </>
              )}
            </Button>
          </section>
        )}

        <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-line bg-white/60 p-3.5">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand" />
          <p className="text-[10px] leading-relaxed text-muted">
            Your device asks for permission before sharing anything. We only
            store the address you confirm here, and you can edit or delete it
            later from{" "}
            <Link
              to="/profile/addresses"
              className="font-bold text-brand hover:underline"
            >
              My addresses
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
