import { describe, expect, it } from "vitest";
import { locationReviewSchema, locationSchema } from "@/server/validators/location.schema";

describe("locationSchema", () => {
  it("accepts a valid location submission", () => {
    const parsed = locationSchema.parse({
      name: "Warm Water Pool",
      locationType: "pool",
      description: "Quiet private pool.",
      latitude: "47.0105",
      longitude: "28.8638",
      accessInfo: "Booking required.",
      photoUrl: "https://example.com/pool.jpg",
    });

    expect(parsed.latitude).toBe(47.0105);
    expect(parsed.locationType).toBe("pool");
  });

  it("rejects invalid coordinates", () => {
    expect(() =>
      locationSchema.parse({
        name: "Ocean",
        locationType: "natural_water",
        latitude: "120",
        longitude: "10",
      })
    ).toThrow();
  });
});

describe("locationReviewSchema", () => {
  it("accepts approval actions", () => {
    const parsed = locationReviewSchema.parse({
      locationId: "00000000-0000-0000-0000-000000000000",
      action: "approve",
    });

    expect(parsed.action).toBe("approve");
  });
});
