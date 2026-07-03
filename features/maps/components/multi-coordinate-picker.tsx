"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DivIcon, LeafletMouseEvent, Map as LeafletMap, Marker } from "leaflet";
import { MapPinIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PractitionerMarkerGroup } from "@/features/maps/types";
import { formatCoordinate } from "@/features/maps/utils";
import { cn } from "@/lib/utils";

type LeafletModule = typeof import("leaflet") & {
  default?: typeof import("leaflet");
};

type Coordinates = {
  latitude: number;
  longitude: number;
  note: string | null;
  sortOrder: number;
};

type MultiCoordinatePickerProps = {
  name: string;
  defaultLocations: Coordinates[];
  markerGroup?: PractitionerMarkerGroup;
  dictionary: {
    mapPickerTitle: string;
    mapPickerDescription: string;
    selectedCoordinates: string;
    noCoordinatesSelected: string;
    latitude: string;
    longitude: string;
    removeLocation: string;
    locationNotePlaceholder: string;
  };
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeLocations(locations: Coordinates[]) {
  return locations.map((location, index) => ({
    latitude: location.latitude,
    longitude: location.longitude,
    note: location.note ?? null,
    sortOrder: index,
  }));
}

function createIcon(
  iconFactory: typeof import("leaflet"),
  markerGroup: PractitionerMarkerGroup,
  markerLabel: string
): DivIcon {
  return iconFactory.divIcon({
    className: `janzu-map-marker practitioner ${markerGroup}`,
    html: `<span>${escapeHtml(markerLabel)}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export function MultiCoordinatePicker({
  name,
  defaultLocations,
  markerGroup = "apprentice",
  dictionary,
}: MultiCoordinatePickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [locations, setLocations] = useState<Coordinates[]>(() => normalizeLocations(defaultLocations));
  const [isMapReady, setIsMapReady] = useState(false);

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

      leafletRef.current = L;
      const firstLocation = defaultLocations[0];
      const center: [number, number] = firstLocation
        ? [firstLocation.latitude, firstLocation.longitude]
        : [20, 0];

      const map = L.map(container, {
        center,
        zoom: firstLocation ? 9 : 2,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (event: LeafletMouseEvent) => {
        setLocations((currentLocations) =>
          normalizeLocations([
            ...currentLocations,
            {
              latitude: event.latlng.lat,
              longitude: event.latlng.lng,
              note: null,
              sortOrder: currentLocations.length,
            },
          ])
        );
      });

      mapRef.current = map;
      setIsMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 0);
    }

    void renderMap().catch((error: unknown) => {
      console.error("Janzu multi-coordinate picker failed to initialize", error);
    });

    return () => {
      cancelled = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRefs.current = [];
        setIsMapReady(false);
      }
    };
  }, [defaultLocations]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;

    if (!isMapReady || !L || !map) {
      return;
    }

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = locations.map((location, index) => {
      const marker = L.marker([location.latitude, location.longitude], {
        icon: createIcon(L, markerGroup, String(index + 1)),
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const nextCoordinates = marker.getLatLng();

        setLocations((currentLocations) =>
          normalizeLocations(
            currentLocations.map((currentLocation, locationIndex) =>
              locationIndex === index
                ? {
                    ...currentLocation,
                    latitude: nextCoordinates.lat,
                    longitude: nextCoordinates.lng,
                  }
                : currentLocation
            )
          )
        );
      });

      return marker;
    });
  }, [isMapReady, locations, markerGroup]);

  const serializedLocations = useMemo(() => JSON.stringify(locations), [locations]);

  return (
    <div className="grid min-w-0 gap-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPinIcon className="h-4 w-4" />
          {dictionary.mapPickerTitle}
        </div>
        <p className="text-sm text-muted-foreground">{dictionary.mapPickerDescription}</p>
      </div>

      <input name={name} type="hidden" value={serializedLocations} readOnly />

      <div
        ref={containerRef}
        className="min-h-[320px] min-w-0 overflow-hidden rounded-md border bg-muted"
        aria-label={dictionary.mapPickerTitle}
      />

      <div
        className={cn(
          "grid min-w-0 gap-2 overflow-hidden rounded-md border p-3 text-sm",
          locations.length > 0 ? "bg-background" : "border-dashed text-muted-foreground"
        )}
      >
        {locations.length > 0 ? (
          <>
            <span className="font-medium">{dictionary.selectedCoordinates}</span>
            <div className="grid gap-2">
              {locations.map((location, index) => (
                <div
                  key={`${location.latitude}-${location.longitude}-${index}`}
                  className="grid gap-2 rounded-md border p-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 break-words">
                      {index + 1}. {dictionary.latitude} {formatCoordinate(location.latitude)},{" "}
                      {dictionary.longitude} {formatCoordinate(location.longitude)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={dictionary.removeLocation}
                      onClick={() => {
                        setLocations((currentLocations) =>
                          normalizeLocations(currentLocations.filter((_, locationIndex) => locationIndex !== index))
                        );
                      }}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={location.note ?? ""}
                    onChange={(event) => {
                      const nextNote = event.target.value;

                      setLocations((currentLocations) =>
                        normalizeLocations(
                          currentLocations.map((currentLocation, locationIndex) =>
                            locationIndex === index
                              ? {
                                  ...currentLocation,
                                  note: nextNote,
                                }
                              : currentLocation
                          )
                        )
                      );
                    }}
                    placeholder={dictionary.locationNotePlaceholder}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          dictionary.noCoordinatesSelected
        )}
      </div>
    </div>
  );
}
