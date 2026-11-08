import { lazy, Suspense, type ComponentProps } from "react";

const MapSkeleton = ({ height = 250 }: { height?: number }) => (
  <div
    className="skeleton w-full rounded-3xl"
    style={{ height }}
    aria-label="Loading map"
  />
);

const TrackingMapLazy = lazy(() =>
  import("./leaflet-maps").then((module) => ({
    default: module.TrackingMap,
  })),
);

const AddressPickerMapLazy = lazy(() =>
  import("./leaflet-maps").then((module) => ({
    default: module.AddressPickerMap,
  })),
);

export function TrackingMap(
  props: ComponentProps<typeof TrackingMapLazy>,
) {
  return (
    <Suspense fallback={<MapSkeleton height={250} />}>
      <TrackingMapLazy {...props} />
    </Suspense>
  );
}

export function AddressPickerMap(
  props: ComponentProps<typeof AddressPickerMapLazy>,
) {
  return (
    <Suspense fallback={<MapSkeleton height={240} />}>
      <AddressPickerMapLazy {...props} />
    </Suspense>
  );
}
