"use client";

import { useMemo, useState } from "react";
import { format, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SessionAvailabilityDateTimePickerProps = {
  dictionary: {
    startsAt: string;
    pickDate: string;
    time: string;
  };
};

function toLocalDateTimeValue(date: Date | undefined, time: string) {
  if (!date || !time) {
    return "";
  }

  return `${format(date, "yyyy-MM-dd")}T${time}`;
}

export function SessionAvailabilityDateTimePicker({
  dictionary,
}: SessionAvailabilityDateTimePickerProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("09:00");
  const value = useMemo(() => toLocalDateTimeValue(date, time), [date, time]);

  return (
    <div className="grid gap-2">
      <Label htmlFor="availabilityStartsAtDate">{dictionary.startsAt}</Label>
      <input id="availabilityStartsAt" name="startsAt" type="hidden" value={value} readOnly />
      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="availabilityStartsAtDate"
              type="button"
              variant="outline"
              className={cn(
                "min-w-0 justify-start overflow-hidden text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="truncate">{date ? format(date, "PPP") : dictionary.pickDate}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={{ before: startOfDay(new Date()) }}
            />
          </PopoverContent>
        </Popover>
        <div className="grid gap-1">
          <Label htmlFor="availabilityStartsAtTime" className="sr-only">
            {dictionary.time}
          </Label>
          <Input
            id="availabilityStartsAtTime"
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
}
