import { z } from "zod";
import { certificationJourneyStates } from "@/server/models/certification.model";

export const certificationOverrideSchema = z.object({
  journeyId: z.string().uuid(),
  expectedState: z.enum(certificationJourneyStates),
  resultingState: z.enum(certificationJourneyStates),
  reason: z.string().trim().min(10).max(1000),
  evidenceReference: z.string().trim().min(3).max(1000),
});

export type CertificationOverridePayload = z.infer<typeof certificationOverrideSchema>;
