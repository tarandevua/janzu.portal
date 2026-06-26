export type MapMarkerKind = "practitioner" | "location";

export type MapMarker = {
  id: string;
  kind: MapMarkerKind;
  title: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  href?: string;
  meta?: string | null;
};

export type MapCenter = {
  latitude: number;
  longitude: number;
  zoom: number;
};
