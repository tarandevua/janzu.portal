export type MapMarkerKind = "practitioner" | "location";
export type PractitionerMarkerGroup = "apprentice" | "participant" | "facilitator";

export type MapMarker = {
  id: string;
  kind: MapMarkerKind;
  practitionerGroup?: PractitionerMarkerGroup;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  fallbackText?: string | null;
  note?: string | null;
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
