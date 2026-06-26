"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { MapMarker } from "@/features/maps/types";
import { createMarkerPopupHtml, getMapCenter } from "@/features/maps/utils";
import { cn } from "@/lib/utils";

type ClusteredMapProps = {
  markers: MapMarker[];
  emptyText: string;
  className?: string;
};

type LeafletWithMarkerCluster = typeof import("leaflet") & {
  markerClusterGroup: (options: {
    showCoverageOnHover: boolean;
    maxClusterRadius: number;
  }) => import("leaflet").LayerGroup;
};

type LeafletModule = typeof import("leaflet") & {
  default?: typeof import("leaflet");
};

export function ClusteredMap({ markers, emptyText, className }: ClusteredMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      const container = containerRef.current;

      if (!container || markers.length === 0) {
        return;
      }

      const leafletModule = (await import("leaflet")) as LeafletModule;
      await import("leaflet.markercluster");
      const L = leafletModule.default ?? leafletModule;

      if (cancelled || !containerRef.current) {
        return;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const center = getMapCenter(markers);
      const map = L.map(container, {
        center: [center.latitude, center.longitude],
        zoom: center.zoom,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const clusterGroup = (L as unknown as LeafletWithMarkerCluster).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 48,
      });

      const bounds: [number, number][] = [];

      markers.forEach((marker) => {
        const className =
          marker.kind === "location" ? "janzu-map-marker location" : "janzu-map-marker practitioner";
        const icon = L.divIcon({
          className,
          html: `<span>${marker.kind === "location" ? "L" : "P"}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const coordinates: [number, number] = [marker.latitude, marker.longitude];

        L.marker(coordinates, { icon }).bindPopup(createMarkerPopupHtml(marker)).addTo(clusterGroup);
        bounds.push(coordinates);
      });

      clusterGroup.addTo(map);

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 10 });
      }

      mapRef.current = map;
    }

    void renderMap().catch((error: unknown) => {
      console.error("Janzu map failed to initialize", error);
    });

    return () => {
      cancelled = true;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [markers]);

  if (markers.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[360px] items-center justify-center rounded-md border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground",
          className
        )}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("min-h-[420px] overflow-hidden rounded-md border bg-muted", className)}
    />
  );
}
