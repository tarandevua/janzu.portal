import type { CommunityEvent } from "@/server/models/event.model";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EventListProps = {
  events: CommunityEvent[];
  dictionary: {
    listTitle: string;
    listDescription: string;
    empty: string;
    titleLabel: string;
    type: string;
    locationName: string;
    startsAt: string;
    capacity: string;
    status: string;
    retreat: string;
    training: string;
    communityGathering: string;
    draft: string;
    published: string;
    cancelled: string;
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

export function EventList({ events, dictionary }: EventListProps) {
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
                  <TableHead>{dictionary.status}</TableHead>
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
                    <TableCell>
                      <Badge variant={event.status === "published" ? "default" : "secondary"}>
                        {getStatusLabel(event.status, dictionary)}
                      </Badge>
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
