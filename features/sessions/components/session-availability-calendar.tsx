"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { CalendarPlusIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { SessionAvailabilitySlot } from "@/server/models/session-availability.model";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week" | "day";

type SessionAvailabilityCalendarProps = {
  locale: Locale;
  slots: SessionAvailabilitySlot[];
  isPending: boolean;
  onCreateSlot: (formData: FormData) => void;
  onCancelSlot: (formData: FormData) => void;
  onCancelSeries: (formData: FormData) => void;
  dictionary: {
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
    duration: string;
    cancelSlot: string;
    emptyDaySlots: string;
    booked: string;
    available: string;
    cancelled: string;
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

const hours = Array.from({ length: 16 }, (_, index) => index + 6);
const weekStartsOn = 1;

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function toLocalDateTimeValue(date: Date, time: string) {
  return `${toDateKey(date)}T${time}`;
}

function getDaysBetween(start: Date, end: Date) {
  const days: Date[] = [];
  let cursor = startOfDay(start);
  const lastDay = startOfDay(end);

  while (cursor <= lastDay) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days;
}

function getMonthGridDays(date: Date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn });

  return getDaysBetween(gridStart, gridEnd);
}

function getWeekDays(date: Date) {
  const weekStart = startOfWeek(date, { weekStartsOn });

  return getDaysBetween(weekStart, addDays(weekStart, 6));
}

function formatSlotTime(slot: SessionAvailabilitySlot, locale: Locale) {
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(slot.startsAt))} - ${formatter.format(new Date(slot.endsAt))}`;
}

function getStatusLabel(
  status: SessionAvailabilitySlot["status"],
  dictionary: SessionAvailabilityCalendarProps["dictionary"]
) {
  if (status === "booked") {
    return dictionary.booked;
  }

  if (status === "cancelled") {
    return dictionary.cancelled;
  }

  return dictionary.available;
}

export function SessionAvailabilityCalendar({
  locale,
  slots,
  isPending,
  onCreateSlot,
  onCancelSlot,
  onCancelSeries,
  dictionary,
}: SessionAvailabilityCalendarProps) {
  const [view, setView] = useState<CalendarView>("month");
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const slotsByDay = useMemo(() => {
    const map = new Map<string, SessionAvailabilitySlot[]>();

    for (const slot of slots) {
      const key = toDateKey(new Date(slot.startsAt));
      const daySlots = map.get(key) ?? [];

      daySlots.push(slot);
      map.set(key, daySlots);
    }

    for (const daySlots of map.values()) {
      daySlots.sort((first, second) => (
        new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime()
      ));
    }

    return map;
  }, [slots]);
  const selectedDaySlots = slotsByDay.get(toDateKey(selectedDate)) ?? [];
  const selectedStartsAt = toLocalDateTimeValue(selectedDate, selectedTime);

  function movePrevious() {
    if (view === "month") {
      setCursorDate((date) => subMonths(date, 1));
      return;
    }

    if (view === "week") {
      setCursorDate((date) => subWeeks(date, 1));
      return;
    }

    setCursorDate((date) => addDays(date, -1));
    setSelectedDate((date) => addDays(date, -1));
  }

  function moveNext() {
    if (view === "month") {
      setCursorDate((date) => addMonths(date, 1));
      return;
    }

    if (view === "week") {
      setCursorDate((date) => addWeeks(date, 1));
      return;
    }

    setCursorDate((date) => addDays(date, 1));
    setSelectedDate((date) => addDays(date, 1));
  }

  function moveToday() {
    const today = new Date();

    setCursorDate(today);
    setSelectedDate(today);
  }

  function selectDate(date: Date, time = selectedTime) {
    setSelectedDate(date);
    setSelectedTime(time);

    if (view === "day") {
      setCursorDate(date);
    }
  }

  function handleViewChange(value: string) {
    const nextView = value as CalendarView;

    setView(nextView);
    setCursorDate(selectedDate);
  }

  function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreateSlot(new FormData(event.currentTarget));
  }

  function handleCancelSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCancelSlot(new FormData(event.currentTarget));
  }

  function handleCancelSeriesSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCancelSeries(new FormData(event.currentTarget));
  }

  const title =
    view === "month"
      ? format(cursorDate, "MMMM yyyy")
      : view === "week"
        ? `${format(getWeekDays(cursorDate)[0], "MMM d")} - ${format(getWeekDays(cursorDate)[6], "MMM d, yyyy")}`
        : format(cursorDate, "PPP");

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={movePrevious}>
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="sr-only">{dictionary.previousPeriod}</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={moveToday}>
            {dictionary.today}
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={moveNext}>
            <ChevronRightIcon className="h-4 w-4" />
            <span className="sr-only">{dictionary.nextPeriod}</span>
          </Button>
          <h3 className="min-w-0 text-base font-semibold">{title}</h3>
        </div>
        <Tabs value={view} onValueChange={handleViewChange}>
          <TabsList>
            <TabsTrigger value="month">{dictionary.monthView}</TabsTrigger>
            <TabsTrigger value="week">{dictionary.weekView}</TabsTrigger>
            <TabsTrigger value="day">{dictionary.dayView}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "month" ? (
        <div className="overflow-hidden rounded-md border">
          <div className="grid grid-cols-7 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
            {getWeekDays(cursorDate).map((day) => (
              <div key={day.toISOString()} className="px-2 py-2">
                {format(day, "EEE")}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {getMonthGridDays(cursorDate).map((day) => {
              const daySlots = slotsByDay.get(toDateKey(day)) ?? [];

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={cn(
                    "min-h-28 border-b border-r p-2 text-left transition-colors hover:bg-muted/60",
                    !isSameMonth(day, cursorDate) && "bg-muted/20 text-muted-foreground",
                    isSameDay(day, selectedDate) && "bg-primary/10",
                    isToday(day) && "ring-1 ring-inset ring-primary"
                  )}
                >
                  <span className="text-xs font-medium">{format(day, "d")}</span>
                  <div className="mt-2 grid gap-1">
                    {daySlots.slice(0, 3).map((slot) => (
                      <span
                        key={slot.id}
                        className={cn(
                          "truncate rounded-sm px-1.5 py-1 text-[11px]",
                          slot.status === "available"
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {formatSlotTime(slot, locale)}
                      </span>
                    ))}
                    {daySlots.length > 3 ? (
                      <span className="text-[11px] text-muted-foreground">+{daySlots.length - 3}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "week" ? (
        <div className="overflow-x-auto rounded-md border">
          <div className="grid min-w-[720px] grid-cols-[4rem_repeat(7,minmax(5rem,1fr))]">
            <div className="border-b bg-muted/40 p-2" />
            {getWeekDays(cursorDate).map((day) => (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => selectDate(day)}
                className={cn(
                  "border-b border-l bg-muted/40 p-2 text-left text-xs font-medium",
                  isSameDay(day, selectedDate) && "bg-primary/10"
                )}
              >
                <span>{format(day, "EEE")}</span>
                <span className="ml-1">{format(day, "d")}</span>
              </button>
            ))}
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="border-b p-2 text-xs text-muted-foreground">{`${hour}:00`}</div>
                {getWeekDays(cursorDate).map((day) => {
                  const time = `${String(hour).padStart(2, "0")}:00`;
                  const daySlots = (slotsByDay.get(toDateKey(day)) ?? []).filter(
                    (slot) => new Date(slot.startsAt).getHours() === hour
                  );

                  return (
                    <button
                      key={`${day.toISOString()}-${hour}`}
                      type="button"
                      onClick={() => selectDate(day, time)}
                      className={cn(
                        "min-h-16 border-b border-l p-1 text-left hover:bg-muted/60",
                        isSameDay(day, selectedDate) && selectedTime === time && "bg-primary/10"
                      )}
                    >
                      <div className="grid gap-1">
                        {daySlots.map((slot) => (
                          <span key={slot.id} className="truncate rounded-sm bg-emerald-100 px-1.5 py-1 text-[11px] text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                            {formatSlotTime(slot, locale)}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {view === "day" ? (
        <div className="overflow-hidden rounded-md border">
          {hours.map((hour) => {
            const time = `${String(hour).padStart(2, "0")}:00`;
            const hourSlots = selectedDaySlots.filter(
              (slot) => new Date(slot.startsAt).getHours() === hour
            );

            return (
              <button
                key={hour}
                type="button"
                onClick={() => selectDate(cursorDate, time)}
                className={cn(
                  "grid min-h-16 w-full grid-cols-[4rem_1fr] border-b text-left hover:bg-muted/60",
                  selectedTime === time && "bg-primary/10"
                )}
              >
                <span className="p-2 text-xs text-muted-foreground">{time}</span>
                <span className="grid gap-1 border-l p-2">
                  {hourSlots.map((slot) => (
                    <span key={slot.id} className="rounded-sm bg-emerald-100 px-2 py-1 text-xs text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                      {formatSlotTime(slot, locale)}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-4 rounded-md border p-4 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-3">
          <h3 className="text-sm font-semibold">
            {dictionary.selectedDay}: {format(selectedDate, "PPP")}
          </h3>
          <form onSubmit={handleCreateSubmit} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_8rem_12rem_8rem_auto] xl:items-end">
            <input type="hidden" name="startsAt" value={selectedStartsAt} readOnly />
            <div className="grid gap-2">
              <Label htmlFor="calendarSlotTime">{dictionary.slotTime}</Label>
              <Input
                id="calendarSlotTime"
                type="time"
                value={selectedTime}
                onChange={(event) => setSelectedTime(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="calendarSlotDuration">{dictionary.duration}</Label>
              <Input
                id="calendarSlotDuration"
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
              <Label htmlFor="calendarSlotRepeat">{dictionary.repeat}</Label>
              <Select name="repeat" defaultValue="none">
                <SelectTrigger id="calendarSlotRepeat">
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
              <Label htmlFor="calendarSlotRepeatCount">{dictionary.repeatCount}</Label>
              <Input
                id="calendarSlotRepeatCount"
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
              {dictionary.addSlot}
            </Button>
          </form>
        </div>
        <div className="grid gap-3">
          <h3 className="text-sm font-semibold">{dictionary.calendarView}</h3>
          {selectedDaySlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dictionary.emptyDaySlots}</p>
          ) : (
            <div className="grid gap-2">
              {selectedDaySlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between gap-3 rounded-md border p-2">
                  <div className="grid gap-1">
                    <span className="text-sm font-medium">{formatSlotTime(slot, locale)}</span>
                    <Badge className="w-fit" variant={slot.status === "available" ? "secondary" : "outline"}>
                      {getStatusLabel(slot.status, dictionary)}
                    </Badge>
                  </div>
                  {slot.status === "available" ? (
                    <div className="flex flex-wrap justify-end gap-2">
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
      </div>
    </div>
  );
}
