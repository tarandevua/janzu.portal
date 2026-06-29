import { z } from "zod";
import { roles } from "@/server/models/rbac.model";

export const userRoleMutationSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(roles),
});

export const userInviteSchema = z.object({
  email: z.string().trim().email().max(240),
  fullName: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(160).nullable().optional()
  ),
  role: z.enum(roles),
});

export const authSettingsSchema = z.object({
  allowUnknownMagicLinkLogin: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const userPublicProfileSchema = z.object({
  userId: z.string().uuid(),
  isPublic: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export type UserRoleMutationPayload = z.infer<typeof userRoleMutationSchema>;
export type UserInvitePayload = z.infer<typeof userInviteSchema>;
export type AuthSettingsPayload = z.infer<typeof authSettingsSchema>;
export type UserPublicProfilePayload = z.infer<typeof userPublicProfileSchema>;
