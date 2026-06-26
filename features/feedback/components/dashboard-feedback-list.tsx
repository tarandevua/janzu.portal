import { StarIcon } from "lucide-react";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Locale } from "@/lib/i18n/config";
import type { DashboardFeedback, FeedbackParticipant } from "@/server/models/feedback.model";

type FeedbackDashboardDictionary = {
  dashboardTitle: string;
  dashboardDescription: string;
  participant: string;
  allParticipants: string;
  applyFilter: string;
  sessionDate: string;
  client: string;
  rating: string;
  experienceText: string;
  emotionalImpact: string;
  submittedAt: string;
  emptyDashboard: string;
  previous: string;
  next: string;
  page: string;
};

type DashboardFeedbackListProps = {
  locale: Locale;
  feedback: DashboardFeedback[];
  participants: FeedbackParticipant[];
  selectedParticipantId?: string;
  canFilterParticipants: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  previousHref: string;
  nextHref: string;
  dictionary: FeedbackDashboardDictionary;
};

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateTime(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DashboardFeedbackList({
  locale,
  feedback,
  participants,
  selectedParticipantId,
  canFilterParticipants,
  page,
  pageSize,
  totalCount,
  previousHref,
  nextHref,
  dictionary,
}: DashboardFeedbackListProps) {
  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{dictionary.dashboardTitle}</CardTitle>
          <CardDescription>{dictionary.dashboardDescription}</CardDescription>
        </div>
        {canFilterParticipants ? (
          <form method="get" className="flex min-w-64 gap-2">
            <Select name="participantId" defaultValue={selectedParticipantId ?? "all"}>
              <SelectTrigger aria-label={dictionary.participant}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dictionary.allParticipants}</SelectItem>
                {participants.map((participant) => (
                  <SelectItem key={participant.practitionerId} value={participant.practitionerId}>
                    {participant.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">
              {dictionary.applyFilter}
            </Button>
          </form>
        ) : null}
      </CardHeader>
      <CardContent>
        {feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.emptyDashboard}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {canFilterParticipants ? (
                    <TableHead>{dictionary.participant}</TableHead>
                  ) : null}
                  <TableHead>{dictionary.sessionDate}</TableHead>
                  <TableHead>{dictionary.client}</TableHead>
                  <TableHead>{dictionary.rating}</TableHead>
                  <TableHead>{dictionary.experienceText}</TableHead>
                  <TableHead>{dictionary.emotionalImpact}</TableHead>
                  <TableHead>{dictionary.submittedAt}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((item) => (
                  <TableRow key={item.feedbackId}>
                    {canFilterParticipants ? (
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <p>{item.practitionerName}</p>
                          <p className="text-xs text-muted-foreground">{item.practitionerEmail}</p>
                        </div>
                      </TableCell>
                    ) : null}
                    <TableCell>{formatDate(locale, item.sessionDate)}</TableCell>
                    <TableCell>{item.clientName ?? ""}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        <StarIcon className="h-4 w-4 fill-current" />
                        {item.rating}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[18rem] text-sm text-muted-foreground">
                      {item.experienceText ?? ""}
                    </TableCell>
                    <TableCell className="max-w-[18rem] text-sm text-muted-foreground">
                      {item.emotionalImpact ?? ""}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(locale, item.submittedAt)}
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
