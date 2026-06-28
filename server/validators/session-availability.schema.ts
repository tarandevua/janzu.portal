import { z } from "zod";

const datetimeLocalPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const sessionAvailabilitySchema = z.object({
  startsAt: z.string().regex(datetimeLocalPattern),
  durationMinutes: z.coerce.number().int().min(15).max(480),
}).transform((value, context) => {
  const startDate = new Date(value.startsAt);

  if (Number.isNaN(startDate.getTime())) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startsAt"],
      message: "Start time is invalid.",
    });

    return z.NEVER;
  }

  if (startDate.getTime() <= Date.now()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startsAt"],
      message: "Start time must be in the future.",
    });

    return z.NEVER;
  }

  const endDate = new Date(startDate.getTime() + value.durationMinutes * 60_000);

  return {
    startsAt: startDate.toISOString(),
    endsAt: endDate.toISOString(),
    durationMinutes: value.durationMinutes,
  };
});

export const cancelSessionAvailabilitySchema = z.object({
  slotId: z.string().uuid(),
});

export type SessionAvailabilityPayload = z.infer<typeof sessionAvailabilitySchema>;
export type CancelSessionAvailabilityPayload = z.infer<typeof cancelSessionAvailabilitySchema>;
