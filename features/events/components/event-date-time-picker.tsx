"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type EventDateTimePickerProps = {
  id: string;
  name: string;
  label: string;
  date: Date | undefined;
  time: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  disabledBefore?: Date;
  minTime?: string;
  dictionary: {
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

export function EventDateTimePicker({
  id,
  name,
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  disabledBefore,
  minTime,
  dictionary,
}: EventDateTimePickerProps) {
  const value = useMemo(() => toLocalDateTimeValue(date, time), [date, time]);

  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={`${id}-date`}>{label}</Label>
      <input id={id} name={name} type="hidden" value={value} readOnly />
      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id={`${id}-date`}
              type="button"
              variant="outline"
              className={cn(
                "min-w-0 justify-start overflow-hidden text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon />
              <span className="truncate">{date ? format(date, "PPP") : dictionary.pickDate}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              disabled={disabledBefore ? { before: disabledBefore } : undefined}
            />
          </PopoverContent>
        </Popover>
        <div className="grid gap-1">
          <Label htmlFor={`${id}-time`} className="sr-only">
            {dictionary.time}
          </Label>
          <Input
            id={`${id}-time`}
            type="time"
            value={time}
            min={minTime}
            onChange={(event) => onTimeChange(event.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
}
