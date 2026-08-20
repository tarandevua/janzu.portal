import { describe, expect, it } from "vitest";
import { emailPreferenceKeys } from "@/server/models/transactional-email.model";
import {
  brevoWebhookSchema,
  emailPreferencesSchema,
} from "@/server/validators/transactional-email.schema";

describe("TASK-502 email boundary schemas", () => {
  it("requires every optional preference exactly once", () => {
    expect(
      emailPreferencesSchema.safeParse({
        preferences: emailPreferenceKeys.map((key) => ({ key, enabled: true })),
      }).success
    ).toBe(true);
    expect(
      emailPreferencesSchema.safeParse({
        preferences: emailPreferenceKeys.map(() => ({ key: "session_updates", enabled: true })),
      }).success
    ).toBe(false);
  });

  it("accepts only supported provider delivery events", () => {
    expect(
      brevoWebhookSchema.safeParse({ event: "delivered", "message-id": "provider-1" }).success
    ).toBe(true);
    expect(
      brevoWebhookSchema.safeParse({ event: "opened", "message-id": "provider-1" }).success
    ).toBe(false);
  });
});
