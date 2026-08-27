import type { MapMarker } from "@/features/maps/types";
import type { Locale } from "@/lib/i18n/config";
import type { PractitionerMapPoint } from "@/server/models/practitioner.model";

export function toPractitionerMapMarkers(
  points: PractitionerMapPoint[],
  options: {
    locale: Locale;
    detailsLabel: string;
    includeDetailsLink: boolean;
    whatsappLabel?: string;
  }
): MapMarker[] {
  return points.map((point) => ({
    id: point.markerId,
    kind: "practitioner",
    practitionerGroup: point.publicGroup,
    title: point.displayName,
    imageUrl: point.profileImageUrl,
    fallbackText: point.displayName.slice(0, 2).toUpperCase(),
    latitude: point.latitude,
    longitude: point.longitude,
    meta: [point.city, point.country].filter(Boolean).join(", "),
    description: point.whatsappNumber && options.whatsappLabel
      ? `${options.whatsappLabel}: ${point.whatsappNumber}`
      : undefined,
    href: options.includeDetailsLink
      ? `/${options.locale}/practitioners/${point.profileId}`
      : undefined,
    hrefLabel: options.includeDetailsLink ? options.detailsLabel : undefined,
  }));
}
