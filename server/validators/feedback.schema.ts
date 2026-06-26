import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
};

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  experienceText: z.preprocess(emptyToNull, z.string().trim().min(1).max(5000)),
  emotionalImpact: z.preprocess(emptyToNull, z.string().trim().max(5000).nullable().optional()),
  feltInFacilitatorArms: z.preprocess(emptyToNull, z.string().trim().min(1).max(5000)),
  supportAtEnd: z.enum(["yes", "not_enough", "other"]),
  supportOtherText: z.preprocess(emptyToNull, z.string().trim().max(5000).nullable().optional()),
  continueWaterProcess: z.enum(["another_session", "no_thank_you"]),
  interestedLearningJanzu: z.coerce.boolean(),
  learningName: z.preprocess(emptyToNull, z.string().trim().max(200).nullable().optional()),
  learningPhone: z.preprocess(emptyToNull, z.string().trim().max(80).nullable().optional()),
  anythingElse: z.preprocess(emptyToNull, z.string().trim().max(5000).nullable().optional()),
  gdprAgreed: z.coerce.boolean().refine((value) => value, "GDPR agreement is required"),
}).superRefine((data, context) => {
  if (data.supportAtEnd === "other" && !data.supportOtherText) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["supportOtherText"],
      message: "Support description is required",
    });
  }

  if (data.interestedLearningJanzu && !data.learningName) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["learningName"],
      message: "Name is required",
    });
  }

  if (data.interestedLearningJanzu && !data.learningPhone) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["learningPhone"],
      message: "Phone is required",
    });
  }
});

export const feedbackTokenSchema = z.string().trim().min(24).max(128);

export type FeedbackPayload = z.infer<typeof feedbackSchema>;
