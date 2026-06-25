import { describe, expect, it } from "vitest";
import { clientSchema } from "@/server/validators/client.schema";

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
