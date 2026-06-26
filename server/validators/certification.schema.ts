import { z } from "zod";

export const certificationApprovalSchema = z.object({
  practitionerId: z.string().uuid(),
});

export type CertificationApprovalPayload = z.infer<typeof certificationApprovalSchema>;
