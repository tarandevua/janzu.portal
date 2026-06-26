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

export const locationTypes = ["pool", "spa", "natural_water"] as const;

export const locationSchema = z.object({
  name: z.string().trim().min(1).max(180),
  locationType: z.enum(locationTypes),
  description: z.preprocess(emptyToNull, z.string().trim().max(5000).nullable().optional()),
  latitude: coordinate(-90, 90),
  longitude: coordinate(-180, 180),
  accessInfo: z.preprocess(emptyToNull, z.string().trim().max(3000).nullable().optional()),
  photoUrl: z.preprocess(emptyToNull, z.string().trim().url().nullable().optional()),
});

export const locationReviewSchema = z.object({
  locationId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export type LocationPayload = z.infer<typeof locationSchema>;
export type LocationReviewPayload = z.infer<typeof locationReviewSchema>;
