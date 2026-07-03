import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
};

const optionalUrl = z.preprocess(
  emptyToNull,
  z.string().trim().url().nullable().optional()
);

const optionalProfileImageReference = z.preprocess(
  emptyToNull,
  z
    .string()
    .trim()
    .max(2048)
    .refine(
      (value) =>
        value.startsWith("/api/media/r2/avatars/") || z.string().url().safeParse(value).success,
      "Profile image must be an app media path or URL."
    )
    .nullable()
    .optional()
);

const optionalText = z.preprocess(
  emptyToNull,
  z.string().trim().max(5000).nullable().optional()
);

const coordinate = (minimum: number, maximum: number) =>
  z.preprocess(emptyToNull, z.coerce.number().min(minimum).max(maximum).nullable().optional());

const practiceLocationSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  note: z.preprocess(emptyToNull, z.string().trim().max(500).nullable().optional()),
  sortOrder: z.coerce.number().int().min(0),
});

const normalizedPracticeLocationSchema = practiceLocationSchema.transform((location) => ({
  ...location,
  note: location.note ?? null,
}));

export const practitionerProfileSchema = z.object({
  fullName: z.preprocess(emptyToNull, z.string().trim().max(160).nullable().optional()),
  bio: optionalText,
  country: z.preprocess(emptyToNull, z.string().trim().max(120).nullable().optional()),
  city: z.preprocess(emptyToNull, z.string().trim().max(120).nullable().optional()),
  latitude: coordinate(-90, 90),
  longitude: coordinate(-180, 180),
  practiceLocations: z.array(normalizedPracticeLocationSchema).max(12).default([]),
  languages: z
    .array(z.string().trim().min(1).max(64))
    .max(20)
    .default([]),
  website: optionalUrl,
  profileImageUrl: optionalProfileImageReference,
  isPublic: z.boolean().default(false),
});

export type PractitionerProfilePayload = z.infer<typeof practitionerProfileSchema>;

export function parsePracticeLocations(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }

  let json: unknown;

  try {
    json = JSON.parse(value);
  } catch {
    return [];
  }

  const parsed = z.array(normalizedPracticeLocationSchema).max(12).safeParse(json);

  if (!parsed.success) {
    return [];
  }

  return parsed.data.map((location, index) => ({
    latitude: location.latitude,
    longitude: location.longitude,
    note: location.note ?? null,
    sortOrder: index,
  }));
}

export function parseLanguages(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((language) => language.trim())
    .filter(Boolean);
}
