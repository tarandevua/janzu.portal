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
  country: z.preprocess(emptyToNull, z.string().trim().max(120).nullable().optional()),
  city: z.preprocess(emptyToNull, z.string().trim().max(120).nullable().optional()),
  notes: z.preprocess(emptyToNull, z.string().trim().max(5000).nullable().optional()),
  lifecycleStatus: z.enum(["prospect", "active", "inactive"]).optional().default("active"),
});

const optionalOther = z.preprocess(emptyToNull, z.string().trim().max(160).nullable().optional());

export const clientOutreachSchema = z.object({
  contactedOn: z.string().date(),
  channel: z.enum(["phone", "email", "whatsapp", "message", "in_person", "other"]),
  channelOther: optionalOther,
  sessionOffered: z.coerce.boolean(),
  response: z.enum(["interested", "needs_time", "declined", "no_response", "booked", "other"]),
  responseOther: optionalOther,
  notes: z.preprocess(emptyToNull, z.string().trim().max(5000).nullable().optional()),
  followUpOn: z.preprocess(emptyToNull, z.string().date().nullable().optional()),
}).superRefine((value, context) => {
  if (value.channel === "other" && !value.channelOther) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["channelOther"], message: "Required for other channel." });
  }
  if (value.response === "other" && !value.responseOther) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["responseOther"], message: "Required for other response." });
  }
  if (value.followUpOn && value.followUpOn < value.contactedOn) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["followUpOn"], message: "Follow-up cannot precede contact." });
  }
});

export const clientFollowUpDateSchema = z.object({ followUpOn: z.string().date() });

export type ClientPayload = z.infer<typeof clientSchema>;
