"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SessionDatePickerProps = {
  label: string;
  placeholder: string;
};

export function SessionDatePicker({ label, placeholder }: SessionDatePickerProps) {
  const [date, setDate] = useState<Date>();
  const value = useMemo(() => (date ? format(date, "yyyy-MM-dd") : ""), [date]);

  return (
    <div className="grid gap-2">
      <Label htmlFor="sessionDate-date">{label}</Label>
      <input id="sessionDate" name="sessionDate" type="hidden" value={value} required readOnly />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="sessionDate-date"
            type="button"
            variant="outline"
            className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>{date ? format(date, "PPP") : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <Calendar mode="single" selected={date} onSelect={setDate} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
