import { CalendarPlusIcon, XIcon } from "lucide-react";
import { createAvailabilitySlot, cancelAvailabilitySlot } from "@/features/sessions/actions";
import type { Locale } from "@/lib/i18n/config";
import type { SessionAvailabilitySlot } from "@/server/models/session-availability.model";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SessionAvailabilityManagerProps = {
  locale: Locale;
  slots: SessionAvailabilitySlot[];
  status?: string;
  dictionary: {
    availabilityTitle: string;
    availabilityDescription: string;
    addAvailability: string;
    startsAt: string;
    duration: string;
    availableSlots: string;
    emptyAvailability: string;
    booked: string;
    available: string;
    cancelled: string;
    cancelSlot: string;
    availabilityCreated: string;
    availabilityCancelled: string;
    availabilityInvalid: string;
  };
};

function formatSlotRange(slot: SessionAvailabilitySlot, locale: Locale) {
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const start = formatter.format(new Date(slot.startsAt));
  const end = new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
  }).format(new Date(slot.endsAt));

  return `${start} - ${end}`;
}

function getStatusLabel(
  status: SessionAvailabilitySlot["status"],
  dictionary: SessionAvailabilityManagerProps["dictionary"]
) {
  if (status === "booked") {
    return dictionary.booked;
  }

  if (status === "cancelled") {
    return dictionary.cancelled;
  }

  return dictionary.available;
}

export function SessionAvailabilityManager({
  locale,
  slots,
  status,
  dictionary,
}: SessionAvailabilityManagerProps) {
  const createAction = createAvailabilitySlot.bind(null, locale);
  const cancelAction = cancelAvailabilitySlot.bind(null, locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.availabilityTitle}</CardTitle>
        <CardDescription>{dictionary.availabilityDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {status === "availability-created" ? (
          <p className="text-sm font-medium text-emerald-700">{dictionary.availabilityCreated}</p>
        ) : null}
        {status === "availability-cancelled" ? (
          <p className="text-sm font-medium text-emerald-700">{dictionary.availabilityCancelled}</p>
        ) : null}
        {status === "availability-invalid" ? (
          <p className="text-sm font-medium text-destructive">{dictionary.availabilityInvalid}</p>
        ) : null}
        <form action={createAction} className="grid gap-4 md:grid-cols-[1fr_9rem_auto] md:items-end">
          <div className="grid gap-2">
            <Label htmlFor="availabilityStartsAt">{dictionary.startsAt}</Label>
            <Input id="availabilityStartsAt" name="startsAt" type="datetime-local" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="availabilityDuration">{dictionary.duration}</Label>
            <Input
              id="availabilityDuration"
              name="durationMinutes"
              type="number"
              min="15"
              max="480"
              step="15"
              defaultValue="60"
              required
            />
          </div>
          <Button type="submit">
            <CalendarPlusIcon className="h-4 w-4" />
            {dictionary.addAvailability}
          </Button>
        </form>
        <div className="grid gap-3">
          <h3 className="text-sm font-medium">{dictionary.availableSlots}</h3>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dictionary.emptyAvailability}</p>
          ) : (
            <div className="grid gap-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">{formatSlotRange(slot, locale)}</p>
                    <Badge className="w-fit" variant={slot.status === "available" ? "secondary" : "outline"}>
                      {getStatusLabel(slot.status, dictionary)}
                    </Badge>
                  </div>
                  {slot.status === "available" ? (
                    <form action={cancelAction}>
                      <input type="hidden" name="slotId" value={slot.id} />
                      <Button type="submit" size="sm" variant="outline">
                        <XIcon className="h-4 w-4" />
                        {dictionary.cancelSlot}
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
