import { z } from "zod";

export const notificationIdSchema = z.string().uuid();

export const markNotificationReadSchema = z.object({
  notificationId: notificationIdSchema,
});
