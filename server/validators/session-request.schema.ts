import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
};

export const sessionRequestSchema = z.object({
  practitionerId: z.string().uuid(),
  requesterName: z.string().trim().min(2).max(120),
  requesterEmail: z.string().trim().email().max(240),
  requesterPhone: z.preprocess(emptyToNull, z.string().trim().max(80).nullable().optional()),
  preferredDate: z.preprocess(
    emptyToNull,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()
  ),
  message: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable().optional()),
});

export const sessionRequestReviewSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["accepted", "declined"]),
});

export type SessionRequestPayload = z.infer<typeof sessionRequestSchema>;
export type SessionRequestReviewPayload = z.infer<typeof sessionRequestReviewSchema>;
