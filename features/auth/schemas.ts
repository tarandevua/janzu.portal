import { z } from "zod";

export const magicLinkSchema = z.object({
  email: z.string().trim().email()
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
