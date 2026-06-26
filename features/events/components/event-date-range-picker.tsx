"use client";

import { useEffect, useState } from "react";
import { addDays, format, isBefore, isSameDay } from "date-fns";
import { EventDateTimePicker } from "@/features/events/components/event-date-time-picker";

type EventDateRangePickerProps = {
  dictionary: {
    startsAt: string;
    endsAt: string;
    pickDate: string;
    time: string;
  };
};

function getDateTime(date: Date | undefined, time: string) {
  if (!date || !time) {
    return null;
  }

  return new Date(`${format(date, "yyyy-MM-dd")}T${time}`);
}

function addOneHour(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  const nextHours = Number(hours) + 1;

  if (nextHours >= 24) {
    return "00:00";
  }

  return `${String(nextHours).padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function EventDateRangePicker({ dictionary }: EventDateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState<Date>();
  const [endTime, setEndTime] = useState("10:00");

  useEffect(() => {
    const start = getDateTime(startDate, startTime);
    const end = getDateTime(endDate, endTime);

    if (!startDate || !start) {
      return;
    }

    if (!endDate || !end || end <= start) {
      const nextEndTime = addOneHour(startTime);
      setEndDate(nextEndTime === "00:00" ? addDays(startDate, 1) : startDate);
      setEndTime(nextEndTime);
    }
  }, [endDate, endTime, startDate, startTime]);

  const endMinTime =
    startDate && endDate && isSameDay(startDate, endDate) ? addOneHour(startTime) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <EventDateTimePicker
        id="startsAt"
        name="startsAt"
        label={dictionary.startsAt}
        date={startDate}
        time={startTime}
        onDateChange={setStartDate}
        onTimeChange={setStartTime}
        dictionary={dictionary}
      />
      <EventDateTimePicker
        id="endsAt"
        name="endsAt"
        label={dictionary.endsAt}
        date={endDate}
        time={endTime}
        onDateChange={(nextDate) => {
          if (startDate && nextDate && isBefore(nextDate, startDate)) {
            setEndDate(startDate);
            return;
          }

          setEndDate(nextDate);
        }}
        onTimeChange={setEndTime}
        disabledBefore={startDate}
        minTime={endMinTime}
        dictionary={dictionary}
      />
    </div>
  );
}
