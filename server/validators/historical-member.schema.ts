import { z } from "zod";

const text = z.string().trim().min(1).max(1000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
export const historicalDetailsSchema = z.object({
  period: text,
  location: text,
  teachingInstructor: text,
  cohort: z.string().trim().max(160).default(""),
  identityEvidence: z.string().trim().max(1000).default(""),
  declaration: z.string().trim().max(1000).default(""),
  evidence: z.array(z.object({
    reference: text,
    source: text,
    type: z.enum(["primary", "corroborating"]),
  }).strict()).max(10),
  level: z.enum(["level_1", "level_2"]).optional(),
  startedOn: date.optional(),
  completedOn: date.optional(),
  courseworkComplete: z.boolean().optional(),
  attendanceComplete: z.boolean().optional(),
  priorEligibilityEvidence: text.optional(),
  coveredFrom: date.optional(),
  cutoff: date.optional(),
  claimedTotal: z.number().int().min(0).max(100000).optional(),
  calculationMethod: text.optional(),
  historicalRecognitionEvidence: text.optional(),
}).strict();
export const historicalImportRowSchema = z.object({
  source: z.string().trim().min(1).max(160),
  key: z.string().trim().min(1).max(160),
  memberId: z.string().uuid(),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  kind: z.enum(["training", "sessions", "facilitator", "instructor"]),
  details: historicalDetailsSchema,
}).strict().superRefine((row, ctx) => {
  const d = row.details;
  if ((row.kind === "training" && !d.level) ||
      (row.kind === "sessions" && (!d.coveredFrom || !d.cutoff || d.claimedTotal === undefined || !d.calculationMethod)) ||
      (d.startedOn && d.completedOn && d.startedOn > d.completedOn) ||
      (d.coveredFrom && d.cutoff && d.coveredFrom > d.cutoff)) {
    ctx.addIssue({ code: "custom", message: "Invalid claim dates or required claim fields" });
  }
});
export const historicalImportSchema = z.array(historicalImportRowSchema).min(1).max(100);
export type HistoricalImportRow = z.infer<typeof historicalImportRowSchema>;

export const historicalActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("assign"), id: z.string().uuid(), revision: z.number().int().positive(), reviewerId: z.string().uuid(), reason: text }),
  z.object({ action: z.literal("review"), id: z.string().uuid(), revision: z.number().int().positive(), decision: z.enum(["approved", "partially_approved", "pending_information", "rejected", "disputed"]), approvedTotal: z.number().int().min(0).max(100000), reason: text, noConflict: z.literal(true) }),
  z.object({ action: z.literal("recuse"), id: z.string().uuid(), revision: z.number().int().positive(), reason: text }),
  z.object({ action: z.literal("revise"), id: z.string().uuid(), revision: z.number().int().positive(), details: historicalDetailsSchema, reason: text }),
]);
export type HistoricalAction = z.infer<typeof historicalActionSchema>;
