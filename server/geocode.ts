type NominatimResponse = {
  address?: Record<string, string | undefined>;
  display_name?: string;
};

type GeocodePayload = {
  line: string;
  township: string;
  city: string;
  displayName: string;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; payload: GeocodePayload }>();

function firstValue(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim().length > 0) ?? "";
}

function json(payload: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

/**
 * Reverse-geocode handler shared by the Vite dev/preview server and the Vercel
 * edge function.
 */
export async function handleGeocode(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return json({ error: "Invalid coordinates" }, 400);
  }

  // Rounding keeps the cache useful without mixing up neighbouring buildings.
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return json(cached.payload, 200, {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "en");
  url.searchParams.set("zoom", "18");

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        // Nominatim's usage policy requires an identifying User-Agent.
        "User-Agent": "YumGo/1.0 (food delivery; contact: support@yumgo.app)",
      },
    });

    if (!response.ok) {
      return json({ error: "Geocoding service unavailable" }, 502);
    }

    const data = (await response.json()) as NominatimResponse;
    const address = data.address ?? {};

    const payload: GeocodePayload = {
      line: firstValue(
        address.house_number && address.road
          ? `${address.house_number} ${address.road}`
          : undefined,
        address.road,
        address.pedestrian,
        address.footway,
        address.neighbourhood,
        address.quarter,
        address.suburb,
      ),
      township: firstValue(
        address.suburb,
        address.town,
        address.city_district,
        address.district,
        address.county,
        address.state_district,
      ),
      city: firstValue(
        address.city,
        address.town,
        address.village,
        address.state,
      ),
      displayName: data.display_name ?? "",
    };

    cache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload,
    });

    return json(payload, 200, {
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    });
  } catch {
    return json({ error: "Geocoding service unavailable" }, 502);
  }
}
