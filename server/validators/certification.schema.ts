import { z } from "zod";
import {
  certificationJourneyStates,
  level2ReadinessStatuses,
  assessmentStatuses,
} from "@/server/models/certification.model";

export const certificationOverrideSchema = z.object({
  journeyId: z.string().uuid(),
  expectedState: z.enum(certificationJourneyStates),
  resultingState: z.enum(certificationJourneyStates),
  reason: z.string().trim().min(10).max(1000),
  evidenceReference: z.string().trim().min(3).max(1000),
});

export const assessmentReadinessRequestSchema = z.object({ journeyId: z.string().uuid() });

export const assessmentReadinessDecisionSchema = z.object({
  requestId: z.string().uuid(),
  approve: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(1000).nullable(),
}).superRefine((value, context) => {
  if (value.approve === "rejected" && (!value.reason || value.reason.length < 10)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["reason"], message: "A reason of at least 10 characters is required." });
  }
});

export const assessorDesignationSchema = z.object({
  userId: z.string().uuid(),
  active: z.enum(["true", "false"]),
  reason: z.string().trim().min(10).max(1000),
});

export const assessmentAssignmentSchema = z.object({
  assessmentId: z.string().uuid(),
  assessorUserId: z.string().uuid(),
});

export const assessmentScheduleSchema = z.object({
  assessmentId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
});

export const assessmentOutcomeSchema = z.object({
  assessmentId: z.string().uuid(),
  status: z.enum(assessmentStatuses).refine((status) => ["incomplete", "revision_required", "failed", "passed"].includes(status)),
  notes: z.string().trim().max(4000).nullable(),
  nextAction: z.string().trim().max(1000).nullable(),
}).superRefine((value, context) => {
  if (value.status !== "passed" && (!value.nextAction || value.nextAction.length < 10)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["nextAction"], message: "An explicit next action of at least 10 characters is required." });
  }
});

export const assessmentRemediationSchema = z.object({ assessmentId: z.string().uuid() });

export const certificateIssueSchema = z.object({ journeyId: z.string().uuid() });
export const certificateReplacementSchema = z.object({
  certificateId: z.string().uuid(),
  requestId: z.string().uuid().nullable(),
  reason: z.string().trim().min(10).max(1000),
});
export const certificateRevocationSchema = z.object({
  certificateId: z.string().uuid(),
  reason: z.string().trim().min(10).max(1000),
  evidenceReference: z.string().trim().min(3).max(1000),
});
export const certificateReplacementRequestSchema = z.object({
  certificateId: z.string().uuid(),
  reason: z.string().trim().min(10).max(1000),
});
export const certificateReplacementRejectionSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().min(10).max(1000),
});
export const certificateAppealSchema = z.object({
  certificateId: z.string().uuid(),
  reason: z.string().trim().min(10).max(2000),
  evidenceReference: z.string().trim().max(1000).nullable(),
});
export const certificateAppealDecisionSchema = z.object({
  appealId: z.string().uuid(),
  decision: z.enum(["upheld", "reinstated"]),
  reason: z.string().trim().min(10).max(2000),
});

export type CertificationOverridePayload = z.infer<typeof certificationOverrideSchema>;

export const level2ReadinessRequestSchema = z.object({
  journeyId: z.string().uuid(),
});

export const level2ReadinessDecisionSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(level2ReadinessStatuses).refine(
    (status) => ["approved", "rejected", "revision_required"].includes(status),
    "Choose an Instructor decision."
  ),
  reason: z.string().trim().max(1000).nullable(),
}).superRefine((value, context) => {
  if (value.status !== "approved" && (!value.reason || value.reason.length < 10)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reason"],
      message: "A reason of at least 10 characters is required.",
    });
  }
});
