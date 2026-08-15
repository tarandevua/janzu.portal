import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const decision = readFileSync(
  resolve(process.cwd(), "docs/decisions/DEC-06-notification-event-matrix.md"),
  "utf8"
);

const eventFamilies = [
  "Welcome",
  "Session registered",
  "Booking request",
  "Feedback received",
  "Session validated",
  "Instructor assignment",
  "25-session milestone",
  "Level 2 decision",
  "50-session milestone",
  "Assessment state",
  "Certification",
  "Certificate",
  "Role changes",
] as const;

describe("TASK-501 notification event matrix", () => {
  it("is accepted and covers every roadmap event family", () => {
    expect(decision).toContain("- Status: Accepted");

    for (const eventFamily of eventFamilies) {
      expect(decision).toContain(`| ${eventFamily} |`);
    }
  });

  it("defines every required delivery dimension", () => {
    expect(decision).toContain("Recipients");
    expect(decision).toContain("Channels and preference");
    expect(decision).toContain("Required safe data");
    expect(decision).toContain("Exact destination");
    expect(decision).toContain("Delivery idempotency key");
    expect(decision).toContain("recipient-locale snapshot of `en` or `es`");
  });

  it("protects server authorization and sensitive workflow content", () => {
    expect(decision).toContain("A client must never supply or override a recipient identifier");
    expect(decision).toContain("Every destination must re-check authentication");
    expect(decision).toContain("feedback free text");
    expect(decision).toContain("former Instructor receives no future events");
  });

  it("defines downstream welcome and delivery contracts", () => {
    expect(decision).toContain("`welcome.activated:{userId}:v1`");
    expect(decision).toContain("`provider_accepted`");
    expect(decision).toContain("`failed_permanent`");
    expect(decision).toContain("TASK-103 implements only `welcome.activated`");
    expect(decision).toContain("TASK-502 implements the reusable outbox");
  });
});
