import { describe, expect, it } from "vitest";
import { eventRsvpSchema, eventSchema } from "@/server/validators/event.schema";

describe("eventSchema", () => {
  it("accepts a valid event", () => {
    const parsed = eventSchema.parse({
      title: "Janzu Retreat",
      description: "A community retreat.",
      eventType: "retreat",
      locationName: "Warm Water Center",
      latitude: "47.0105000",
      longitude: "28.8638000",
      startsAt: "2026-07-01T10:00:00.000Z",
      endsAt: "2026-07-03T17:00:00.000Z",
      capacity: "24",
      status: "published",
    });

    expect(parsed.capacity).toBe(24);
    expect(parsed.eventType).toBe("retreat");
  });

  it("rejects events where the end date is before the start date", () => {
    expect(() =>
      eventSchema.parse({
        title: "Backwards event",
        eventType: "training",
        locationName: "Pool",
        latitude: "47.0105000",
        longitude: "28.8638000",
        startsAt: "2026-07-03T17:00:00.000Z",
        endsAt: "2026-07-01T10:00:00.000Z",
        capacity: "12",
        status: "published",
      })
    ).toThrow();
  });

  it("rejects empty event coordinates", () => {
    expect(() =>
      eventSchema.parse({
        title: "Unpinned event",
        eventType: "community_gathering",
        locationName: "Somewhere",
        latitude: "",
        longitude: "",
        startsAt: "2026-07-01T10:00:00.000Z",
        endsAt: "2026-07-01T12:00:00.000Z",
        capacity: "12",
        status: "published",
      })
    ).toThrow();
  });

  it("rejects empty RSVP ids", () => {
    expect(() => eventRsvpSchema.parse({ eventId: "" })).toThrow();
  });
});
