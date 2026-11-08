import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

type LatLng = { lat: number; lng: number };

function pinIcon(
  label: string,
  color: string,
  emoji: string,
  labelPosition: "top" | "bottom" = "top",
) {
  const labelStyle =
    labelPosition === "top"
      ? "top:-22px;left:50%;transform:translateX(-50%);"
      : "top:calc(100% + 4px);left:50%;transform:translateX(-50%);";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;background:${color};color:white;border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,.22);font-size:16px;line-height:1"><span>${emoji}</span></div><div style="position:absolute;${labelStyle}white-space:nowrap;background:white;color:#171717;border-radius:999px;padding:2px 7px;font-size:9px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.12)">${label}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
}

function driverIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:#00B14F;color:white;border:3px solid white;box-shadow:0 0 0 8px rgba(0, 177, 79,.16),0 6px 18px rgba(0,0,0,.25);font-size:20px;line-height:1"><span>🛵</span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
    map.fitBounds(bounds, { padding: [44, 44], maxZoom: 15 });
  }, [map, points]);
  return null;
}

export function TrackingMap({
  restaurant,
  customer,
  driver,
  showDriver,
  height = 250,
  className,
}: {
  restaurant: LatLng & { name: string };
  customer: LatLng & { address: string };
  driver?: LatLng & { name: string; plate: string };
  showDriver?: boolean;
  height?: number;
  className?: string;
}) {
  const restaurantIcon = useMemo(
    () => pinIcon("Restaurant", "#00B14F", "🍽️"),
    [],
  );
  const customerIcon = useMemo(
    () => pinIcon("You", "#171717", "🏠", "bottom"),
    [],
  );
  const scooterIcon = useMemo(() => driverIcon(), []);
  const points = useMemo(
    () => [restaurant, customer, ...(driver && showDriver ? [driver] : [])],
    [restaurant, customer, driver, showDriver],
  );

  return (
    <div
      /* isolate keeps Leaflet's panes/controls (z-index 400-1000) from
         escaping the card and painting over sticky headers or bottom bars. */
      className={cn("tracking-map relative isolate z-0", className)}
      style={{ height, width: "100%", borderRadius: 24, overflow: "hidden" }}
    >
      <MapContainer
        center={[restaurant.lat, restaurant.lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={[
            [restaurant.lat, restaurant.lng],
            [customer.lat, customer.lng],
          ]}
          pathOptions={{
            color: "#00B14F",
            weight: 4,
            opacity: 0.7,
            dashArray: "8 10",
          }}
        />
        <Marker
          position={[restaurant.lat, restaurant.lng]}
          icon={restaurantIcon}
        >
          <Popup>{restaurant.name}</Popup>
        </Marker>
        <Marker position={[customer.lat, customer.lng]} icon={customerIcon}>
          <Popup>{customer.address}</Popup>
        </Marker>
        {driver && showDriver && (
          <Marker position={[driver.lat, driver.lng]} icon={scooterIcon}>
            <Popup>
              <strong>{driver.name}</strong>
              <br />
              {driver.plate}
            </Popup>
          </Marker>
        )}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function Recenter({ value }: { value: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([value.lat, value.lng], map.getZoom(), { animate: true });
  }, [map, value.lat, value.lng]);
  return null;
}

export function AddressPickerMap({
  value,
  onChange,
  height = 240,
}: {
  value: LatLng;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  const markerIcon = useMemo(() => pinIcon("Delivery point", "#00B14F", "📍"), []);

  return (
    <div
      style={{ height, width: "100%", borderRadius: 20, overflow: "hidden" }}
      className="relative isolate z-0 border border-line"
    >
      <MapContainer
        center={[value.lat, value.lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          draggable
          position={[value.lat, value.lng]}
          icon={markerIcon}
          eventHandlers={{
            dragend(event) {
              const marker = event.target as L.Marker;
              const position = marker.getLatLng();
              onChange(position.lat, position.lng);
            },
          }}
        />
        <ClickHandler onPick={onChange} />
        <Recenter value={value} />
      </MapContainer>
    </div>
  );
}
