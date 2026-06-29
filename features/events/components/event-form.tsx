import type { Locale } from "@/lib/i18n/config";
import type { CommunityEvent } from "@/server/models/event.model";
import { createEvent, updateEvent } from "@/features/events/actions";
import { EventDateRangePicker } from "@/features/events/components/event-date-range-picker";
import { LocationCoordinatePicker } from "@/features/locations/components/location-coordinate-picker";
import { RichTextEditor } from "@/features/events/components/rich-text-editor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EventFormProps = {
  locale: Locale;
  status?: string;
  event?: CommunityEvent;
  dictionary: {
    formTitle: string;
    formDescription: string;
    titleLabel: string;
    description: string;
    type: string;
    retreat: string;
    training: string;
    communityGathering: string;
    locationName: string;
    latitude: string;
    longitude: string;
    mapPickerTitle: string;
    mapPickerDescription: string;
    selectedCoordinates: string;
    noCoordinatesSelected: string;
    startsAt: string;
    endsAt: string;
    pickDate: string;
    time: string;
    capacity: string;
    status: string;
    draft: string;
    published: string;
    cancelled: string;
    create: string;
    update: string;
    created: string;
    updated: string;
    invalid: string;
    forbidden: string;
    images: string;
    imageHelp: string;
    bold: string;
    underline: string;
    link: string;
    linkPrompt: string;
  };
};

function getMessage(status: string | undefined, dictionary: EventFormProps["dictionary"]) {
  if (status === "created") {
    return dictionary.created;
  }

  if (status === "updated") {
    return dictionary.updated;
  }

  if (status === "invalid") {
    return dictionary.invalid;
  }

  if (status === "forbidden") {
    return dictionary.forbidden;
  }

  return null;
}

export function EventForm({ locale, status, event, dictionary }: EventFormProps) {
  const action = event ? updateEvent.bind(null, locale) : createEvent.bind(null, locale);
  const message = getMessage(status, dictionary);

  return (
    <form action={action} className="grid min-w-0 gap-4">
      {event ? <input type="hidden" name="eventId" value={event.id} /> : null}
      {message ? (
        <Alert variant={status === "created" ? "default" : "destructive"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="title">{dictionary.titleLabel}</Label>
        <Input id="title" name="title" required defaultValue={event?.title ?? ""} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="eventType">{dictionary.type}</Label>
        <Select name="eventType" required defaultValue={event?.eventType ?? "retreat"}>
          <SelectTrigger id="eventType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="retreat">{dictionary.retreat}</SelectItem>
            <SelectItem value="training">{dictionary.training}</SelectItem>
            <SelectItem value="community_gathering">{dictionary.communityGathering}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="locationName">{dictionary.locationName}</Label>
        <Input id="locationName" name="locationName" required defaultValue={event?.locationName ?? ""} />
      </div>

      <EventDateRangePicker
        initialStartsAt={event?.startsAt}
        initialEndsAt={event?.endsAt}
        dictionary={dictionary}
      />

      <div className="grid gap-2">
        <Label htmlFor="capacity">{dictionary.capacity}</Label>
        <Input id="capacity" name="capacity" type="number" min="1" required defaultValue={event?.capacity ?? ""} />
      </div>

      <LocationCoordinatePicker
        defaultLatitude={event?.latitude ?? null}
        defaultLongitude={event?.longitude ?? null}
        dictionary={dictionary}
      />

      <div className="grid gap-2">
        <Label htmlFor="status">{dictionary.status}</Label>
        <Select name="status" required defaultValue={event?.status ?? "published"}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">{dictionary.draft}</SelectItem>
            <SelectItem value="published">{dictionary.published}</SelectItem>
            <SelectItem value="cancelled">{dictionary.cancelled}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="eventImages">{dictionary.images}</Label>
        <Input id="eventImages" name="eventImages" type="file" accept="image/jpeg,.jpg,.jpeg" multiple />
        <p className="text-sm text-muted-foreground">{dictionary.imageHelp}</p>
      </div>

      <RichTextEditor
        id="description"
        name="description"
        label={dictionary.description}
        defaultValue={event?.description}
        dictionary={dictionary}
      />

      <Button type="submit" className="w-fit">
        {event ? dictionary.update : dictionary.create}
      </Button>
    </form>
  );
}
