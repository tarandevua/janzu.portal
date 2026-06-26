import type { MapCenter, MapMarker } from "@/features/maps/types";

export function hasValidCoordinates<T extends {
  latitude: number | null;
  longitude: number | null;
}>(value: T): value is T & { latitude: number; longitude: number } {
  return (
    typeof value.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    typeof value.longitude === "number" &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

export function getMapCenter(markers: MapMarker[]): MapCenter {
  if (markers.length === 0) {
    return {
      latitude: 20,
      longitude: 0,
      zoom: 2,
    };
  }

  const totals = markers.reduce(
    (accumulator, marker) => ({
      latitude: accumulator.latitude + marker.latitude,
      longitude: accumulator.longitude + marker.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: totals.latitude / markers.length,
    longitude: totals.longitude / markers.length,
    zoom: markers.length === 1 ? 9 : 3,
  };
}

export function formatCoordinate(value: number) {
  return value.toFixed(7);
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createMarkerPopupHtml(marker: MapMarker) {
  const title = escapeHtml(marker.title);
  const description = marker.description ? escapeHtml(marker.description) : "";
  const meta = marker.meta ? escapeHtml(marker.meta) : "";

  return `
    <div class="janzu-map-popup">
      <strong>${title}</strong>
      ${meta ? `<span>${meta}</span>` : ""}
      ${description ? `<p>${description}</p>` : ""}
      ${marker.href ? `<a href="${escapeHtml(marker.href)}">View details</a>` : ""}
    </div>
  `;
}
