import { z } from "zod";

export const supervisionRequestSchema = z.object({
  instructorUserId: z.string().uuid(),
});

export const supervisionResponseSchema = z.object({
  assignmentId: z.string().uuid(),
  decision: z.enum(["accept", "decline"]),
});

export const supervisionEndSchema = z.object({
  assignmentId: z.string().uuid(),
  reason: z.string().trim().max(500).default(""),
});

export const supervisionAdminAssignSchema = z.object({
  traineeUserId: z.string().uuid(),
  instructorUserId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});
