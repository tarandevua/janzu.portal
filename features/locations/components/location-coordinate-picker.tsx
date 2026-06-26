"use client";

import { useEffect, useRef, useState } from "react";
import type { LeafletMouseEvent, Map as LeafletMap, Marker } from "leaflet";
import { MapPinIcon } from "lucide-react";
import { formatCoordinate } from "@/features/maps/utils";
import { cn } from "@/lib/utils";

type LocationCoordinatePickerProps = {
  dictionary: {
    mapPickerTitle: string;
    mapPickerDescription: string;
    selectedCoordinates: string;
    noCoordinatesSelected: string;
    latitude: string;
    longitude: string;
  };
};

type LeafletModule = typeof import("leaflet") & {
  default?: typeof import("leaflet");
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

export function LocationCoordinatePicker({ dictionary }: LocationCoordinatePickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

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

      const map = L.map(container, {
        center: [20, 0],
        zoom: 2,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "janzu-map-marker location",
        html: "<span>L</span>",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

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
      console.error("Janzu location picker failed to initialize", error);
    });

    return () => {
      cancelled = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const latitudeValue = coordinates ? formatCoordinate(coordinates.latitude) : "";
  const longitudeValue = coordinates ? formatCoordinate(coordinates.longitude) : "";

  return (
    <div className="grid gap-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPinIcon className="h-4 w-4" />
          {dictionary.mapPickerTitle}
        </div>
        <p className="text-sm text-muted-foreground">{dictionary.mapPickerDescription}</p>
      </div>

      <input name="latitude" type="hidden" value={latitudeValue} readOnly />
      <input name="longitude" type="hidden" value={longitudeValue} readOnly />

      <div
        ref={containerRef}
        className="min-h-[320px] overflow-hidden rounded-md border bg-muted"
        aria-label={dictionary.mapPickerTitle}
      />

      <div
        className={cn(
          "rounded-md border p-3 text-sm",
          coordinates ? "bg-background" : "border-dashed text-muted-foreground"
        )}
      >
        {coordinates ? (
          <span>
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
