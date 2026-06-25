import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
};

export const clientSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.preprocess(emptyToNull, z.string().trim().email().nullable().optional()),
  phone: z.preprocess(emptyToNull, z.string().trim().max(60).nullable().optional()),
  notes: z.preprocess(emptyToNull, z.string().trim().max(5000).nullable().optional()),
});

export type ClientPayload = z.infer<typeof clientSchema>;
