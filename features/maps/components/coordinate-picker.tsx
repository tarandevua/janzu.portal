"use client";

import { useEffect, useRef, useState } from "react";
import type { LeafletMouseEvent, Map as LeafletMap, Marker } from "leaflet";
import { MapPinIcon } from "lucide-react";
import { formatCoordinate } from "@/features/maps/utils";
import { cn } from "@/lib/utils";

type LeafletModule = typeof import("leaflet") & {
  default?: typeof import("leaflet");
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type CoordinatePickerProps = {
  namePrefix?: string;
  defaultLatitude?: number | null;
  defaultLongitude?: number | null;
  markerLabel?: string;
  dictionary: {
    mapPickerTitle: string;
    mapPickerDescription: string;
    selectedCoordinates: string;
    noCoordinatesSelected: string;
    latitude: string;
    longitude: string;
  };
};

function getInitialCoordinates(latitude?: number | null, longitude?: number | null) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return { latitude, longitude };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function CoordinatePicker({
  namePrefix,
  defaultLatitude,
  defaultLongitude,
  markerLabel = "P",
  dictionary,
}: CoordinatePickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(() =>
    getInitialCoordinates(defaultLatitude, defaultLongitude)
  );

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const leafletModule = (await import("leaflet")) as LeafletModule;
      const L = leafletModule.default ?? leafletModule;

      if (cancelled || !containerRef.current || mapRef.current) {
        return;
      }

      const initialCoordinates = getInitialCoordinates(defaultLatitude, defaultLongitude);
      const center: [number, number] = initialCoordinates
        ? [initialCoordinates.latitude, initialCoordinates.longitude]
        : [20, 0];

      const map = L.map(container, {
        center,
        zoom: initialCoordinates ? 12 : 2,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "janzu-map-marker location",
        html: `<span>${escapeHtml(markerLabel.slice(0, 1))}</span>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (initialCoordinates) {
        markerRef.current = L.marker(center, { icon }).addTo(map);
      }

      map.on("click", (event: LeafletMouseEvent) => {
        const nextCoordinates = {
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        };

        if (!markerRef.current) {
          markerRef.current = L.marker(event.latlng, { icon }).addTo(map);
        } else {
          markerRef.current.setLatLng(event.latlng);
        }

        setCoordinates(nextCoordinates);
      });

      mapRef.current = map;
      window.setTimeout(() => map.invalidateSize(), 0);
    }

    void renderMap().catch((error: unknown) => {
      console.error("Janzu coordinate picker failed to initialize", error);
    });

    return () => {
      cancelled = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [defaultLatitude, defaultLongitude, markerLabel]);

  const latitudeValue = coordinates ? formatCoordinate(coordinates.latitude) : "";
  const longitudeValue = coordinates ? formatCoordinate(coordinates.longitude) : "";
  const latitudeName = namePrefix ? `${namePrefix}Latitude` : "latitude";
  const longitudeName = namePrefix ? `${namePrefix}Longitude` : "longitude";

  return (
    <div className="grid min-w-0 gap-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPinIcon className="h-4 w-4" />
          {dictionary.mapPickerTitle}
        </div>
        <p className="text-sm text-muted-foreground">{dictionary.mapPickerDescription}</p>
      </div>

      <input name={latitudeName} type="hidden" value={latitudeValue} readOnly />
      <input name={longitudeName} type="hidden" value={longitudeValue} readOnly />

      <div
        ref={containerRef}
        className="min-h-[320px] min-w-0 overflow-hidden rounded-md border bg-muted"
        aria-label={dictionary.mapPickerTitle}
      />

      <div
        className={cn(
          "min-w-0 overflow-hidden rounded-md border p-3 text-sm",
          coordinates ? "bg-background" : "border-dashed text-muted-foreground"
        )}
      >
        {coordinates ? (
          <span className="break-words">
            {dictionary.selectedCoordinates}: {dictionary.latitude} {latitudeValue},{" "}
            {dictionary.longitude} {longitudeValue}
          </span>
        ) : (
          dictionary.noCoordinatesSelected
        )}
      </div>
    </div>
  );
}
