import { z } from "zod";
import { emailPreferenceKeys } from "@/server/models/transactional-email.model";

export const emailPreferencesSchema = z.object({
  preferences: z
    .array(z.object({ key: z.enum(emailPreferenceKeys), enabled: z.boolean() }))
    .length(emailPreferenceKeys.length)
    .refine((items) => new Set(items.map((item) => item.key)).size === emailPreferenceKeys.length),
});

export const brevoWebhookSchema = z.object({
  event: z.enum([
    "delivered",
    "soft_bounce",
    "deferred",
    "hard_bounce",
    "blocked",
    "spam",
    "invalid",
    "unsubscribed",
    "request",
  ]),
  "message-id": z.string().min(1).max(512),
  reason: z.string().max(200).optional(),
});
