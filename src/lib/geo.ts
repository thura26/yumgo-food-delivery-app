export type GeoPoint = {
  lat: number;
  lng: number;
};

export type ReverseGeocodeResult = {
  line: string;
  township: string;
  city: string;
  displayName: string;
};

export type GeolocationFailureCode =
  | "unsupported"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unknown";

export class GeolocationError extends Error {
  code: GeolocationFailureCode;

  constructor(code: GeolocationFailureCode, message: string) {
    super(message);
    this.name = "GeolocationError";
    this.code = code;
  }
}

/**
 * Promise wrapper around the browser geolocation API.
 *
 * Keep `enableHighAccuracy` off by default: city-level accuracy is enough for
 * delivery and it responds much faster (and uses less battery) than GPS.
 */
export function getCurrentPosition(
  options: PositionOptions = {},
): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(
        new GeolocationError(
          "unsupported",
          "Your browser does not support location sharing.",
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        const code: GeolocationFailureCode =
          error.code === error.PERMISSION_DENIED
            ? "denied"
            : error.code === error.POSITION_UNAVAILABLE
              ? "unavailable"
              : error.code === error.TIMEOUT
                ? "timeout"
                : "unknown";
        reject(
          new GeolocationError(
            code,
            error.message || "We could not read your current location.",
          ),
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 12_000,
        maximumAge: 5 * 60_000,
        ...options,
      },
    );
  });
}

export function geolocationErrorMessage(error: unknown) {
  if (error instanceof GeolocationError) {
    switch (error.code) {
      case "denied":
        return "Location permission was blocked. You can still type your address or pick it on the map.";
      case "unsupported":
        return "This browser cannot share your location. Please enter your address manually.";
      case "timeout":
        return "Finding your location took too long. Try again or enter your address manually.";
      case "unavailable":
        return "We could not find your location right now. Check your connection and try again.";
      default:
        return "We could not read your location. Please enter your address manually.";
    }
  }

  return "We could not read your location. Please enter your address manually.";
}

/**
 * Reverse geocode through our own API route so the browser never calls the
 * public Nominatim endpoint directly (rate limits, caching and headers stay
 * on the server).
 */
export async function reverseGeocode(
  point: GeoPoint,
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    lat: String(point.lat),
    lng: String(point.lng),
  });

  const response = await fetch(`/api/geocode?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }

  const data = (await response.json()) as Partial<ReverseGeocodeResult>;

  return {
    line: data.line ?? "",
    township: data.township ?? "",
    city: data.city ?? "",
    displayName: data.displayName ?? "",
  };
}

/** Great-circle distance in kilometres. */
export function haversineKm(a: GeoPoint, b: GeoPoint) {
  const radius = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * radius * Math.asin(Math.sqrt(h));
}
