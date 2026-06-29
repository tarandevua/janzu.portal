import type { Locale } from "@/lib/i18n/config";
import type { CommunityEvent } from "@/server/models/event.model";
import { EventForm } from "@/features/events/components/event-form";
import { PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EventListProps = {
  locale: Locale;
  events: CommunityEvent[];
  status?: string;
  dictionary: {
    listTitle: string;
    listDescription: string;
    empty: string;
    formTitle: string;
    formDescription: string;
    titleLabel: string;
    description: string;
    type: string;
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
    images: string;
    edit: string;
    update: string;
    updated: string;
    retreat: string;
    training: string;
    communityGathering: string;
    draft: string;
    published: string;
    cancelled: string;
    create: string;
    created: string;
    invalid: string;
    forbidden: string;
    imageHelp: string;
    bold: string;
    underline: string;
    link: string;
    linkPrompt: string;
  };
};

function getTypeLabel(eventType: CommunityEvent["eventType"], dictionary: EventListProps["dictionary"]) {
  if (eventType === "training") {
    return dictionary.training;
  }

  if (eventType === "community_gathering") {
    return dictionary.communityGathering;
  }

  return dictionary.retreat;
}

function getStatusLabel(status: CommunityEvent["status"], dictionary: EventListProps["dictionary"]) {
  if (status === "draft") {
    return dictionary.draft;
  }

  if (status === "cancelled") {
    return dictionary.cancelled;
  }

  return dictionary.published;
}

export function EventList({ locale, events, status, dictionary }: EventListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.listTitle}</CardTitle>
        <CardDescription>{dictionary.listDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.titleLabel}</TableHead>
                  <TableHead>{dictionary.type}</TableHead>
                  <TableHead>{dictionary.locationName}</TableHead>
                  <TableHead>{dictionary.startsAt}</TableHead>
                  <TableHead>{dictionary.capacity}</TableHead>
                  <TableHead>{dictionary.images}</TableHead>
                  <TableHead>{dictionary.status}</TableHead>
                  <TableHead className="text-right">{dictionary.edit}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{getTypeLabel(event.eventType, dictionary)}</TableCell>
                    <TableCell>{event.locationName}</TableCell>
                    <TableCell>{new Date(event.startsAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {event.rsvpCount}/{event.capacity}
                    </TableCell>
                    <TableCell>{event.media.length}</TableCell>
                    <TableCell>
                      <Badge variant={event.status === "published" ? "default" : "secondary"}>
                        {getStatusLabel(event.status, dictionary)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button type="button" size="sm" variant="outline">
                            <PencilIcon className="h-4 w-4" />
                            {dictionary.edit}
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="flex h-full w-full max-w-[100vw] flex-col overflow-hidden sm:max-w-xl">
                          <SheetHeader className="shrink-0 pr-8">
                            <SheetTitle>{dictionary.edit}</SheetTitle>
                            <SheetDescription>{dictionary.formDescription}</SheetDescription>
                          </SheetHeader>
                          <div className="min-h-0 flex-1 overflow-y-auto py-4">
                            <EventForm
                              locale={locale}
                              status={status}
                              event={event}
                              dictionary={dictionary}
                            />
                          </div>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
