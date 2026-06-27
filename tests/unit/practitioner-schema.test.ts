import { describe, expect, it } from "vitest";
import {
  parseLanguages,
  practitionerProfileSchema,
} from "@/server/validators/practitioner.schema";

describe("practitionerProfileSchema", () => {
  it("accepts a complete public profile", () => {
    const parsed = practitionerProfileSchema.safeParse({
      bio: "Janzu practitioner",
      country: "Spain",
      city: "Barcelona",
      latitude: "41.38",
      longitude: "2.17",
      languages: ["English", "Spanish"],
      website: "https://example.com",
      profileImageUrl: "https://example.com/profile.jpg",
      isPublic: true,
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts app media profile image paths for private R2 objects", () => {
    const parsed = practitionerProfileSchema.safeParse({
      languages: [],
      profileImageUrl: "/api/media/r2/avatars/user-id/profile.jpg",
      isPublic: false,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid coordinates", () => {
    const parsed = practitionerProfileSchema.safeParse({
      latitude: "120",
      longitude: "2.17",
      languages: [],
      isPublic: false,
    });

    expect(parsed.success).toBe(false);
  });

  it("parses comma-separated languages", () => {
    expect(parseLanguages("English, Spanish, Romanian")).toEqual([
      "English",
      "Spanish",
      "Romanian",
    ]);
  });
});
