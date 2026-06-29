import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
};

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const coordinate = (min: number, max: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().min(min).max(max));

export const eventTypes = ["retreat", "training", "community_gathering"] as const;
export const eventStatuses = ["draft", "published", "cancelled"] as const;

function sanitizeRichText(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/<(?!\/?(?:p|div|br|strong|b|u|a)(?:\s|>|\/))/gi, "&lt;")
    .replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
      const hrefMatch = attrs.match(/\shref=(?:"([^"]*)"|'([^']*)')/i);
      const href = (hrefMatch?.[1] ?? hrefMatch?.[2] ?? "").trim();

      if (!/^https?:\/\//i.test(href) && !href.startsWith("mailto:")) {
        return "<a>";
      }

      return `<a href="${href.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">`;
    });
}

export const eventSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    description: z.preprocess(
      emptyToNull,
      z.string().trim().max(5000).transform(sanitizeRichText).nullable().optional()
    ),
    eventType: z.enum(eventTypes),
    locationName: z.string().trim().min(1).max(240),
    latitude: coordinate(-90, 90),
    longitude: coordinate(-180, 180),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    capacity: z.coerce.number().int().min(1).max(10000),
    status: z.enum(eventStatuses).default("published"),
  })
  .refine((value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(), {
    message: "Event end date must be after start date.",
    path: ["endsAt"],
  });

export const eventRsvpSchema = z.object({
  eventId: z.preprocess(emptyToUndefined, z.string().uuid()),
});

export const eventDeleteSchema = z.object({
  eventId: z.preprocess(emptyToUndefined, z.string().uuid()),
});

export const eventMediaIdsSchema = z.array(z.string().uuid()).max(6);

export type EventPayload = z.infer<typeof eventSchema>;
export type EventRsvpPayload = z.infer<typeof eventRsvpSchema>;
