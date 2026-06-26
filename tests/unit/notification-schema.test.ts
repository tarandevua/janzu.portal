import { describe, expect, it } from "vitest";
import { markNotificationReadSchema } from "@/server/validators/notification.schema";

describe("markNotificationReadSchema", () => {
  it("accepts a notification UUID", () => {
    const parsed = markNotificationReadSchema.parse({
      notificationId: "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
    });

    expect(parsed.notificationId).toBe("38ec640a-d72b-4c27-944e-3ff5e63d4b9c");
  });

  it("rejects invalid notification ids", () => {
    expect(() => markNotificationReadSchema.parse({ notificationId: "bad-id" })).toThrow();
  });
});
