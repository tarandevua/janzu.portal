import { describe, expect, it } from "vitest";
import {
  supervisionAdminAssignSchema,
  supervisionRequestSchema,
  supervisionResponseSchema,
} from "@/server/validators/supervision.schema";

const userId = "38ec640a-d72b-4c27-944e-3ff5e63d4b9c";

describe("supervision schemas", () => {
  it("validates explicit requests and responses", () => {
    expect(supervisionRequestSchema.parse({ instructorUserId: userId }).instructorUserId).toBe(userId);
    expect(supervisionResponseSchema.parse({ assignmentId: userId, decision: "accept" }).decision).toBe("accept");
  });

  it("requires an administrative assignment reason", () => {
    expect(() => supervisionAdminAssignSchema.parse({
      traineeUserId: userId,
      instructorUserId: "f7a1701c-90e8-40f0-aad1-75651d4d7387",
      reason: "",
    })).toThrow();
  });
});
