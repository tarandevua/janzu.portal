import { z } from "zod";
import {
  certificationJourneyStates,
  level2ReadinessStatuses,
} from "@/server/models/certification.model";

export const certificationOverrideSchema = z.object({
  journeyId: z.string().uuid(),
  expectedState: z.enum(certificationJourneyStates),
  resultingState: z.enum(certificationJourneyStates),
  reason: z.string().trim().min(10).max(1000),
  evidenceReference: z.string().trim().min(3).max(1000),
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
