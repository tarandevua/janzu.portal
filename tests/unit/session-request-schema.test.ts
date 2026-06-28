import { describe, expect, it } from "vitest";
import {
  sessionRequestReviewSchema,
  sessionRequestSchema,
} from "@/server/validators/session-request.schema";

describe("sessionRequestSchema", () => {
  it("accepts a public session request", () => {
    const parsed = sessionRequestSchema.parse({
      practitionerId: "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
      availabilitySlotId: "81f5b9ac-e081-4af2-a88a-e98dc340d719",
      requesterName: "Mara",
      requesterEmail: "mara@example.com",
      requesterPhone: "",
      message: "I would like to book an introductory session.",
    });

    expect(parsed.requesterPhone).toBeNull();
    expect(parsed.availabilitySlotId).toBe("81f5b9ac-e081-4af2-a88a-e98dc340d719");
  });

  it("rejects invalid public request emails", () => {
    expect(() =>
      sessionRequestSchema.parse({
        practitionerId: "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
        requesterName: "Mara",
        requesterEmail: "not-email",
      })
    ).toThrow();
  });

  it("accepts review decisions", () => {
    const parsed = sessionRequestReviewSchema.parse({
      requestId: "81f5b9ac-e081-4af2-a88a-e98dc340d719",
      status: "accepted",
    });

    expect(parsed.status).toBe("accepted");
  });
});
