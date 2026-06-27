import type { LocationMedia } from "@/server/models/location.model";
import { getR2MediaUrl } from "@/lib/r2-media";

function getMediaUrl(media: LocationMedia) {
  return media.storageKey ? getR2MediaUrl(media.storageKey) : media.publicUrl;
}

export function getLocationMediaItems(media: LocationMedia[]) {
  return media
    .map((item) => ({
      ...item,
      url: getMediaUrl(item),
    }))
    .filter((item): item is LocationMedia & { url: string } => Boolean(item.url))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}
