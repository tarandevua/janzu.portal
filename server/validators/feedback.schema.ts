import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
};

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  experienceText: z.preprocess(emptyToNull, z.string().trim().max(5000).nullable().optional()),
  emotionalImpact: z.preprocess(emptyToNull, z.string().trim().max(5000).nullable().optional()),
});

export const feedbackTokenSchema = z.string().trim().min(24).max(128);

export type FeedbackPayload = z.infer<typeof feedbackSchema>;
