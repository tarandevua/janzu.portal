import type { Locale } from "@/lib/i18n/config";
import type { CommunityEvent } from "@/server/models/event.model";
import { rsvpToEvent } from "@/features/events/actions";
import { EventImageCarousel } from "@/features/events/components/event-image-carousel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PublicEventListProps = {
  locale: Locale;
  events: CommunityEvent[];
  status?: string;
  dictionary: {
    publicTitle: string;
    publicDescription: string;
    emptyPublic: string;
    retreat: string;
    training: string;
    communityGathering: string;
    startsAt: string;
    endsAt: string;
    capacity: string;
    rsvp: string;
    rsvpConfirmed: string;
    full: string;
    rsvpCreated: string;
    rsvpInvalid: string;
  };
};

function getTypeLabel(eventType: CommunityEvent["eventType"], dictionary: PublicEventListProps["dictionary"]) {
  if (eventType === "training") {
    return dictionary.training;
  }

  if (eventType === "community_gathering") {
    return dictionary.communityGathering;
  }

  return dictionary.retreat;
}

function getMessage(status: string | undefined, dictionary: PublicEventListProps["dictionary"]) {
  if (status === "rsvp-created") {
    return dictionary.rsvpCreated;
  }

  if (status === "rsvp-invalid") {
    return dictionary.rsvpInvalid;
  }

  return null;
}

function EventDescription({ html }: { html: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-sm [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_u]:underline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function PublicEventList({ locale, events, status, dictionary }: PublicEventListProps) {
  const action = rsvpToEvent.bind(null, locale);
  const message = getMessage(status, dictionary);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">{dictionary.publicTitle}</h1>
        <p className="max-w-3xl text-muted-foreground">{dictionary.publicDescription}</p>
      </div>

      {message ? (
        <Alert variant={status === "rsvp-invalid" ? "destructive" : "default"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {dictionary.emptyPublic}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => {
            const isFull = event.rsvpCount >= event.capacity;
            const canRsvp = !isFull && !event.hasCurrentUserRsvp;

            return (
              <Card key={event.id}>
                <EventImageCarousel media={event.media} title={event.title} />
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription>{event.locationName}</CardDescription>
                    </div>
                    <Badge variant="secondary">{getTypeLabel(event.eventType, dictionary)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm">
                  {event.description ? <EventDescription html={event.description} /> : null}
                  <div className="grid gap-1 text-muted-foreground">
                    <span>
                      {dictionary.startsAt}: {new Date(event.startsAt).toLocaleString()}
                    </span>
                    <span>
                      {dictionary.endsAt}: {new Date(event.endsAt).toLocaleString()}
                    </span>
                    <span>
                      {dictionary.capacity}: {event.rsvpCount}/{event.capacity}
                    </span>
                  </div>
                  {canRsvp ? (
                    <form action={action}>
                      <input name="eventId" type="hidden" value={event.id} readOnly />
                      <Button type="submit">{dictionary.rsvp}</Button>
                    </form>
                  ) : (
                    <Badge variant="outline">
                      {event.hasCurrentUserRsvp ? dictionary.rsvpConfirmed : dictionary.full}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
