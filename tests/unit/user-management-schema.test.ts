import { describe, expect, it } from "vitest";
import {
  userInviteSchema,
  userRoleMutationSchema,
} from "@/server/validators/user-management.schema";

describe("userRoleMutationSchema", () => {
  it("accepts a valid role mutation", () => {
    const parsed = userRoleMutationSchema.parse({
      userId: "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
      role: "manager",
    });

    expect(parsed.role).toBe("manager");
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
