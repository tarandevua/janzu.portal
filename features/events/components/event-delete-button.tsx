"use client";

import { Trash2Icon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { deleteEvent } from "@/features/events/actions";
import { Button } from "@/components/ui/button";

type EventDeleteButtonProps = {
  locale: Locale;
  eventId: string;
  label: string;
  confirmMessage: string;
};

export function EventDeleteButton({
  locale,
  eventId,
  label,
  confirmMessage,
}: EventDeleteButtonProps) {
  const action = deleteEvent.bind(null, locale);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="eventId" value={eventId} readOnly />
      <Button type="submit" size="sm" variant="destructive">
        <Trash2Icon className="h-4 w-4" />
        {label}
      </Button>
    </form>
  );
}
