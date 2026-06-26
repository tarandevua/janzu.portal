import type { Locale } from "@/lib/i18n/config";
import { createEvent } from "@/features/events/actions";
import { EventDateRangePicker } from "@/features/events/components/event-date-range-picker";
import { LocationCoordinatePicker } from "@/features/locations/components/location-coordinate-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type EventFormProps = {
  locale: Locale;
  status?: string;
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
    created: string;
    invalid: string;
    forbidden: string;
  };
};

function getMessage(status: string | undefined, dictionary: EventFormProps["dictionary"]) {
  if (status === "created") {
    return dictionary.created;
  }

  if (status === "invalid") {
    return dictionary.invalid;
  }

  if (status === "forbidden") {
    return dictionary.forbidden;
  }

  return null;
}

export function EventForm({ locale, status, dictionary }: EventFormProps) {
  const action = createEvent.bind(null, locale);
  const message = getMessage(status, dictionary);

  return (
    <form action={action} className="grid min-w-0 gap-4">
      {message ? (
        <Alert variant={status === "created" ? "default" : "destructive"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="title">{dictionary.titleLabel}</Label>
        <Input id="title" name="title" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="eventType">{dictionary.type}</Label>
        <Select name="eventType" required defaultValue="retreat">
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
        <Input id="locationName" name="locationName" required />
      </div>

      <EventDateRangePicker dictionary={dictionary} />

      <div className="grid gap-2">
        <Label htmlFor="capacity">{dictionary.capacity}</Label>
        <Input id="capacity" name="capacity" type="number" min="1" required />
      </div>

      <LocationCoordinatePicker dictionary={dictionary} />

      <div className="grid gap-2">
        <Label htmlFor="status">{dictionary.status}</Label>
        <Select name="status" required defaultValue="published">
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
        <Label htmlFor="description">{dictionary.description}</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>

      <Button type="submit" className="w-fit">
        {dictionary.create}
      </Button>
    </form>
  );
}
