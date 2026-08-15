import { describe, expect, it } from "vitest";
import { profileVisibilitySchema } from "@/server/validators/practitioner.schema";

describe("profileVisibilitySchema", () => {
  it("accepts a separate audience for every eligible profile group", () => {
    expect(profileVisibilitySchema.parse({
      directory: "community",
      displayName: "community",
      profileImage: "private",
      bio: "community",
      languages: "public",
      location: "private",
      website: "private",
      socialLinks: "private",
    }).directory).toBe("community");
  });

  it("rejects unknown visibility audiences", () => {
    expect(() => profileVisibilitySchema.parse({
      directory: "friends",
      displayName: "private",
      profileImage: "private",
      bio: "private",
      languages: "private",
      location: "private",
      website: "private",
      socialLinks: "private",
    })).toThrow();
  });
});
