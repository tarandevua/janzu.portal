import { describe, expect, it } from "vitest";
import {
  authSettingsSchema,
  userPublicProfileSchema,
  userInviteSchema,
  userInviteResendSchema,
  userRoleMutationSchema,
} from "@/server/validators/user-management.schema";

describe("userRoleMutationSchema", () => {
  it("accepts a valid role mutation", () => {
    const parsed = userRoleMutationSchema.parse({
      userId: "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
      role: "instructor",
    });

    expect(parsed.role).toBe("instructor");
  });

  it("rejects invalid roles", () => {
    expect(() =>
      userRoleMutationSchema.parse({
        userId: "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
        role: "owner",
      })
    ).toThrow();
  });
});

describe("userInviteSchema", () => {
  it("accepts invite details", () => {
    const parsed = userInviteSchema.parse({
      email: "new@example.com",
      fullName: "",
      role: "practitioner",
    });

    expect(parsed.fullName).toBeNull();
    expect(parsed.role).toBe("practitioner");
  });

  it("rejects invalid invite emails", () => {
    expect(() =>
      userInviteSchema.parse({
        email: "not-email",
        role: "practitioner",
      })
    ).toThrow();
  });
});

describe("userInviteResendSchema", () => {
  it("accepts only a valid target user ID", () => {
    expect(userInviteResendSchema.parse({
      userId: "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
    }).userId).toBe("38ec640a-d72b-4c27-944e-3ff5e63d4b9c");

    expect(() => userInviteResendSchema.parse({ userId: "invalid" })).toThrow();
  });
});

describe("authSettingsSchema", () => {
  it("parses the unknown magic-link login toggle", () => {
    const parsed = authSettingsSchema.parse({
      allowUnknownMagicLinkLogin: "false",
    });

    expect(parsed.allowUnknownMagicLinkLogin).toBe(false);
  });
});

describe("userPublicProfileSchema", () => {
  it("parses public profile visibility updates", () => {
    const parsed = userPublicProfileSchema.parse({
      userId: "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
      isPublic: "true",
    });

    expect(parsed.isPublic).toBe(true);
  });
});
