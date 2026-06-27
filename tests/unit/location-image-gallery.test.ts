import { describe, expect, it } from "vitest";
import { getLocationMediaItems } from "@/features/locations/utils/location-media";
import type { LocationMedia } from "@/server/models/location.model";

function media(overrides: Partial<LocationMedia>): LocationMedia {
  return {
    id: overrides.id ?? "media-id",
    locationId: overrides.locationId ?? "location-id",
    storageKey: overrides.storageKey ?? null,
    publicUrl: overrides.publicUrl ?? null,
    altText: overrides.altText ?? null,
    sortOrder: overrides.sortOrder ?? 0,
    createdAt: overrides.createdAt ?? "2026-06-27T00:00:00.000Z",
  };
}

describe("getLocationMediaItems", () => {
  it("sorts location media and maps private R2 keys to app media URLs", () => {
    const items = getLocationMediaItems([
      media({ id: "second", storageKey: "locations/location-id/2.jpg", sortOrder: 2 }),
      media({ id: "first", storageKey: "locations/location-id/1.jpg", sortOrder: 1 }),
      media({ id: "empty", sortOrder: 0 }),
    ]);

    expect(items.map((item) => item.id)).toEqual(["first", "second"]);
    expect(items[0].url).toBe("/api/media/r2/locations/location-id/1.jpg");
  });
});
