import { describe, expect, it } from "vitest";
import { clientOutreachSchema, clientSchema } from "@/server/validators/client.schema";

describe("clientSchema", () => {
  it("accepts a client with optional contact fields", () => {
    const parsed = clientSchema.safeParse({
      name: "Maria",
      email: "maria@example.com",
      phone: "+34 600 000 000",
      notes: "Prefers morning sessions.",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const parsed = clientSchema.safeParse({
      name: "",
      email: "",
      phone: "",
      notes: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid email values", () => {
    const parsed = clientSchema.safeParse({
      name: "Client",
      email: "not-email",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("clientOutreachSchema", () => {
  const valid = {
    contactedOn: "2026-09-22",
    channel: "whatsapp",
    sessionOffered: true,
    response: "interested",
    followUpOn: "2026-09-29",
  };

  it("accepts a structured outreach record", () => {
    expect(clientOutreachSchema.safeParse(valid).success).toBe(true);
  });

  it("requires details when channel or response is other", () => {
    expect(clientOutreachSchema.safeParse({ ...valid, channel: "other" }).success).toBe(false);
    expect(clientOutreachSchema.safeParse({ ...valid, response: "other" }).success).toBe(false);
    expect(clientOutreachSchema.safeParse({
      ...valid,
      channel: "other",
      channelOther: "Instagram",
      response: "other",
      responseOther: "Asked for a brochure",
    }).success).toBe(true);
  });

  it("rejects a follow-up before the contact date", () => {
    expect(clientOutreachSchema.safeParse({ ...valid, followUpOn: "2026-09-21" }).success).toBe(false);
  });
});
