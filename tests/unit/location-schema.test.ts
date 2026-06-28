import { describe, expect, it } from "vitest";
import {
  locationCommunityReviewSchema,
  locationReviewHelpfulSchema,
  locationReviewSchema,
  locationSchema,
} from "@/server/validators/location.schema";

describe("locationSchema", () => {
  it("accepts a valid location submission", () => {
    const parsed = locationSchema.parse({
      name: "Warm Water Pool",
      locationType: "pool",
      description: "Quiet private pool.",
      latitude: "47.0105",
      longitude: "28.8638",
      accessInfo: "Booking required.",
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

  it("rejects empty coordinates", () => {
    expect(() =>
      locationSchema.parse({
        name: "Unpinned place",
        locationType: "pool",
        latitude: "",
        longitude: "",
      })
    ).toThrow();
  });
});

describe("locationCommunityReviewSchema", () => {
  it("accepts location community reviews", () => {
    const parsed = locationCommunityReviewSchema.parse({
      locationId: "00000000-0000-0000-0000-000000000000",
      rating: "5",
      reviewText: "Beautiful and easy to access.",
    });

    expect(parsed.rating).toBe(5);
  });

  it("rejects invalid community ratings and helpful ids", () => {
    expect(() =>
      locationCommunityReviewSchema.parse({
        locationId: "00000000-0000-0000-0000-000000000000",
        rating: "8",
      })
    ).toThrow();

    expect(() => locationReviewHelpfulSchema.parse({ reviewId: "bad-id" })).toThrow();
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

  it("requires a reason when rejecting a location", () => {
    expect(() =>
      locationReviewSchema.parse({
        locationId: "00000000-0000-0000-0000-000000000000",
        action: "reject",
        reason: "",
      })
    ).toThrow();

    const parsed = locationReviewSchema.parse({
      locationId: "00000000-0000-0000-0000-000000000000",
      action: "reject",
      reason: "Access details are incomplete.",
    });

    expect(parsed.reason).toBe("Access details are incomplete.");
  });
});
