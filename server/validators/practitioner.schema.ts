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

export const practitionerProfileSchema = z.object({
  fullName: z.preprocess(emptyToNull, z.string().trim().max(160).nullable().optional()),
  bio: optionalText,
  country: z.preprocess(emptyToNull, z.string().trim().max(120).nullable().optional()),
  city: z.preprocess(emptyToNull, z.string().trim().max(120).nullable().optional()),
  latitude: coordinate(-90, 90),
  longitude: coordinate(-180, 180),
  languages: z
    .array(z.string().trim().min(1).max(64))
    .max(20)
    .default([]),
  website: optionalUrl,
  profileImageUrl: optionalProfileImageReference,
  isPublic: z.boolean().default(false),
});

export type PractitionerProfilePayload = z.infer<typeof practitionerProfileSchema>;

export function parseLanguages(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((language) => language.trim())
    .filter(Boolean);
}
