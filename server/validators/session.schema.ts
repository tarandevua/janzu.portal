import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (typeof value === "string" && (value.trim() === "" || value === "none")) {
    return null;
  }

  return value;
};

export const sessionSchema = z.object({
  clientId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  newClientName: z.preprocess(emptyToNull, z.string().trim().min(1).max(160).nullable().optional()),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  location: z.preprocess(emptyToNull, z.string().trim().max(240).nullable().optional()),
  notes: z.preprocess(emptyToNull, z.string().trim().max(5000).nullable().optional()),
});

export type SessionPayload = z.infer<typeof sessionSchema>;
