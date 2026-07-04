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

function truncateText(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export function createMarkerPopupHtml(marker: MapMarker) {
  const title = escapeHtml(marker.title);
  const description = marker.description ? escapeHtml(truncateText(marker.description, 150)) : "";
  const note = marker.note ? escapeHtml(truncateText(marker.note, 120)) : "";
  const meta = marker.meta ? escapeHtml(marker.meta) : "";

  if (marker.popupVariant === "practice-location") {
    return `
      <div class="janzu-map-popup">
        <strong>${title}</strong>
        ${meta ? `<span>${meta}</span>` : ""}
        ${note ? `<p>${note}</p>` : ""}
      </div>
    `;
  }

  const fallbackText = escapeHtml(marker.fallbackText ?? marker.title.slice(0, 2).toUpperCase());
  const avatar = marker.imageUrl
    ? `<img class="janzu-map-popup-avatar" src="${escapeHtml(marker.imageUrl)}" alt="${title}" loading="lazy" />`
    : `<span class="janzu-map-popup-avatar fallback">${fallbackText}</span>`;

  return `
    <div class="janzu-map-popup">
      <div class="janzu-map-popup-header">
        ${avatar}
        <div>
          <strong>${title}</strong>
          ${meta ? `<span>${meta}</span>` : ""}
        </div>
      </div>
      ${note ? `<p>${note}</p>` : ""}
      ${description ? `<p>${description}</p>` : ""}
      ${marker.href ? `<a href="${escapeHtml(marker.href)}">View details</a>` : ""}
    </div>
  `;
}
