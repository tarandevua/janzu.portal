"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { CalendarPlusIcon, XIcon } from "lucide-react";
import {
  cancelAvailabilitySeriesInline,
  cancelAvailabilitySlotInline,
  createAvailabilitySlotInline,
  type AvailabilityActionResult,
} from "@/features/sessions/actions";
import { SessionAvailabilityCalendar } from "@/features/sessions/components/session-availability-calendar";
import { SessionAvailabilityDateTimePicker } from "@/features/sessions/components/session-availability-date-time-picker";
import type { Locale } from "@/lib/i18n/config";
import type { SessionAvailabilitySlot } from "@/server/models/session-availability.model";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SessionAvailabilityManagerProps = {
  locale: Locale;
  slots: SessionAvailabilitySlot[];
  status?: string;
  dictionary: {
    availabilityTitle: string;
    availabilityDescription: string;
    addAvailability: string;
    startsAt: string;
    pickDate: string;
    time: string;
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
    availabilitySaving: string;
    quickAddView: string;
    calendarView: string;
    monthView: string;
    weekView: string;
    dayView: string;
    previousPeriod: string;
    nextPeriod: string;
    today: string;
    selectedDay: string;
    addSlot: string;
    slotTime: string;
    emptyDaySlots: string;
    closeDetails: string;
    repeat: string;
    repeatNone: string;
    repeatDaily: string;
    repeatWeekly: string;
    repeatBiweekly: string;
    repeatMonthly: string;
    repeatCount: string;
    cancelSeries: string;
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
  const [currentSlots, setCurrentSlots] = useState(slots);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCurrentSlots(slots);
  }, [slots]);

  useEffect(() => {
    if (status === "availability-created") {
      toast.success(dictionary.availabilityCreated);
      return;
    }

    if (status === "availability-cancelled") {
      toast.success(dictionary.availabilityCancelled);
      return;
    }

    if (status === "availability-invalid") {
      toast.error(dictionary.availabilityInvalid);
    }
  }, [
    dictionary.availabilityCancelled,
    dictionary.availabilityCreated,
    dictionary.availabilityInvalid,
    status,
  ]);

  function upsertSlots(slotsToUpsert: SessionAvailabilitySlot[]) {
    setCurrentSlots((items) => {
      const slotsById = new Map(items.map((item) => [item.id, item]));

      for (const slot of slotsToUpsert) {
        slotsById.set(slot.id, slot);
      }

      return [...slotsById.values()].toSorted(
        (first, second) =>
          new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime()
      );
    });
  }

  function runAvailabilityAction(
    action: () => Promise<AvailabilityActionResult>,
    options?: { onSuccess?: () => void }
  ) {
    startTransition(async () => {
      const toastId = toast.loading(dictionary.availabilitySaving);
      const result = await action();

      if (result.ok) {
        upsertSlots(result.slots);
        options?.onSuccess?.();
        toast.success(
          result.status === "availability-created"
            ? dictionary.availabilityCreated
            : dictionary.availabilityCancelled,
          { id: toastId }
        );
        return;
      }

      toast.error(dictionary.availabilityInvalid, { id: toastId });
    });
  }

  function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    runAvailabilityAction(() => createAvailabilitySlotInline(locale, formData), {
      onSuccess: () => form.reset(),
    });
  }

  function handleCancelSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    runAvailabilityAction(() => cancelAvailabilitySlotInline(locale, formData));
  }

  function handleCancelSeriesSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    runAvailabilityAction(() => cancelAvailabilitySeriesInline(locale, formData));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.availabilityTitle}</CardTitle>
        <CardDescription>{dictionary.availabilityDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Tabs defaultValue="quick-add" className="grid gap-4">
          <TabsList className="h-auto w-full justify-start overflow-x-auto">
            <TabsTrigger value="quick-add">{dictionary.quickAddView}</TabsTrigger>
            <TabsTrigger value="calendar">{dictionary.calendarView}</TabsTrigger>
          </TabsList>
          <TabsContent value="quick-add" className="mt-0 grid gap-5">
            <form onSubmit={handleCreateSubmit} className="grid gap-4 lg:grid-cols-[1fr_9rem_12rem_8rem_auto] lg:items-end">
              <SessionAvailabilityDateTimePicker dictionary={dictionary} />
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
              <div className="grid gap-2">
                <Label htmlFor="availabilityRepeat">{dictionary.repeat}</Label>
                <Select name="repeat" defaultValue="none">
                  <SelectTrigger id="availabilityRepeat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{dictionary.repeatNone}</SelectItem>
                    <SelectItem value="daily">{dictionary.repeatDaily}</SelectItem>
                    <SelectItem value="weekly">{dictionary.repeatWeekly}</SelectItem>
                    <SelectItem value="biweekly">{dictionary.repeatBiweekly}</SelectItem>
                    <SelectItem value="monthly">{dictionary.repeatMonthly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="availabilityRepeatCount">{dictionary.repeatCount}</Label>
                <Input
                  id="availabilityRepeatCount"
                  name="repeatCount"
                  type="number"
                  min="1"
                  max="52"
                  defaultValue="8"
                  required
                />
              </div>
              <Button type="submit" disabled={isPending}>
                <CalendarPlusIcon className="h-4 w-4" />
                {dictionary.addAvailability}
              </Button>
            </form>
            <div className="grid gap-3">
              <h3 className="text-sm font-medium">{dictionary.availableSlots}</h3>
              {currentSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">{dictionary.emptyAvailability}</p>
              ) : (
                <div className="grid gap-2">
                  {currentSlots.map((slot) => (
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
                        <div className="flex flex-wrap gap-2">
                          <form onSubmit={handleCancelSubmit}>
                            <input type="hidden" name="slotId" value={slot.id} />
                            <Button type="submit" size="sm" variant="outline" disabled={isPending}>
                              <XIcon className="h-4 w-4" />
                              {dictionary.cancelSlot}
                            </Button>
                          </form>
                          {slot.recurrenceGroupId ? (
                            <form onSubmit={handleCancelSeriesSubmit}>
                              <input type="hidden" name="recurrenceGroupId" value={slot.recurrenceGroupId} />
                              <Button type="submit" size="sm" variant="outline" disabled={isPending}>
                                <XIcon className="h-4 w-4" />
                                {dictionary.cancelSeries}
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="calendar" className="mt-0">
            <SessionAvailabilityCalendar
              locale={locale}
              slots={currentSlots}
              dictionary={dictionary}
              isPending={isPending}
              onCreateSlot={(formData) =>
                runAvailabilityAction(() => createAvailabilitySlotInline(locale, formData))
              }
              onCancelSlot={(formData) =>
                runAvailabilityAction(() => cancelAvailabilitySlotInline(locale, formData))
              }
              onCancelSeries={(formData) =>
                runAvailabilityAction(() => cancelAvailabilitySeriesInline(locale, formData))
              }
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
