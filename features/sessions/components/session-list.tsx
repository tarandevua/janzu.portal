import type { Client } from "@/server/models/client.model";
import type { SessionFeedback } from "@/server/models/feedback.model";
import type { Session } from "@/server/models/session.model";
import type { Locale } from "@/lib/i18n/config";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { createFeedbackLink } from "@/features/feedback/actions";
import { CopyFeedbackLinkButton } from "@/features/feedback/components/copy-feedback-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SessionListProps = {
  locale: Locale;
  sessions: Session[];
  clients: Client[];
  feedbackLinks: SessionFeedback[];
  siteUrl: string;
  page: number;
  pageSize: number;
  totalCount: number;
  previousHref: string;
  nextHref: string;
  dictionary: {
    listTitle: string;
    listDescription: string;
    empty: string;
    date: string;
    client: string;
    duration: string;
    location: string;
    validation: string;
    pending: string;
    validated: string;
    feedback: string;
    createFeedback: string;
    copyFeedback: string;
    copiedFeedback: string;
    previous: string;
    next: string;
    page: string;
  };
};

export function SessionList({
  locale,
  sessions,
  clients,
  feedbackLinks,
  siteUrl,
  page,
  pageSize,
  totalCount,
  previousHref,
  nextHref,
  dictionary,
}: SessionListProps) {
  const clientNames = new Map(clients.map((client) => [client.id, client.name]));
  const feedbackBySessionId = new Map(feedbackLinks.map((feedback) => [feedback.sessionId, feedback]));
  const action = createFeedbackLink.bind(null, locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.listTitle}</CardTitle>
        <CardDescription>{dictionary.listDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.date}</TableHead>
                  <TableHead>{dictionary.client}</TableHead>
                  <TableHead>{dictionary.duration}</TableHead>
                  <TableHead>{dictionary.location}</TableHead>
                  <TableHead>{dictionary.validation}</TableHead>
                  <TableHead>{dictionary.feedback}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.sessionDate}</TableCell>
                    <TableCell>{session.clientId ? clientNames.get(session.clientId) ?? "" : ""}</TableCell>
                    <TableCell>{session.durationMinutes}</TableCell>
                    <TableCell>{session.location ?? ""}</TableCell>
                    <TableCell>
                      <Badge variant={session.isValidated ? "default" : "secondary"}>
                        {session.isValidated ? dictionary.validated : dictionary.pending}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {feedbackBySessionId.has(session.id) ? (
                        <CopyFeedbackLinkButton
                          url={`${siteUrl}/${locale}/feedback/${feedbackBySessionId.get(session.id)?.token}`}
                          label={dictionary.copyFeedback}
                          copiedLabel={dictionary.copiedFeedback}
                        />
                      ) : (
                        <form action={action}>
                          <input type="hidden" name="sessionId" value={session.id} />
                          <Button type="submit" variant="outline" size="sm">
                            {dictionary.createFeedback}
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              previousHref={previousHref}
              nextHref={nextHref}
              dictionary={dictionary}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
