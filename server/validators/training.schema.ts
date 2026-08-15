import { z } from "zod";

const optionalText = (max: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().max(max).nullable()
);

export const trainingRecordSchema = z.object({
  level: z.enum(["level_1", "level_2"]),
  cohort: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(240),
  startedOn: z.string().date(),
  completedOn: z.string().date(),
  teachingInstructorName: z.string().trim().min(1).max(160),
  courseworkComplete: z.enum(["true", "false"]).transform((value) => value === "true"),
  evidenceReference: optionalText(1000),
  notes: optionalText(2000),
}).refine((value) => value.completedOn >= value.startedOn, {
  path: ["completedOn"],
  message: "Completion date cannot precede the start date.",
});

export const trainingReviewSchema = z.object({
  recordId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  reason: optionalText(1000),
}).refine((value) => value.decision === "approve" || Boolean(value.reason), {
  path: ["reason"],
  message: "A rejection reason is required.",
});

export const trainingCorrectionSchema = trainingRecordSchema.and(z.object({
  recordId: z.string().uuid(),
}));
