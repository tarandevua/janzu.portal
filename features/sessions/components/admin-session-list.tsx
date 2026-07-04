"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition, type ComponentProps, type FormEvent, type MouseEvent } from "react";
import type { Locale } from "@/lib/i18n/config";
import type {
  AdminSession,
  AdminSessionFilters,
  AdminSessionParticipant,
} from "@/server/models/session.model";
import type { SessionFeedback } from "@/server/models/feedback.model";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { SessionFeedbackDrawer } from "@/features/sessions/components/session-feedback-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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

type AdminSessionListProps = {
  locale: Locale;
  sessions: AdminSession[];
  feedbackLinks: SessionFeedback[];
  participants: AdminSessionParticipant[];
  filters: AdminSessionFilters;
  page: number;
  pageSize: number;
  totalCount: number;
  resetHref: string;
  previousHref: string;
  nextHref: string;
  dictionary: {
    allSessionsTitle: string;
    allSessionsDescription: string;
    emptyAllSessions: string;
    participant: string;
    allParticipants: string;
    validation: string;
    allValidation: string;
    pending: string;
    validated: string;
    applyFilters: string;
    clearFilters: string;
    date: string;
    client: string;
    practitioner: string;
    location: string;
    feedback: string;
    feedbackUnavailable: string;
    previous: string;
    next: string;
    page: string;
  };
  feedbackDictionary: ComponentProps<typeof SessionFeedbackDrawer>["dictionary"];
};

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function AdminSessionList({
  locale,
  sessions,
  feedbackLinks,
  participants,
  filters,
  page,
  pageSize,
  totalCount,
  resetHref,
  previousHref,
  nextHref,
  dictionary,
  feedbackDictionary,
}: AdminSessionListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const feedbackBySessionId = new Map(feedbackLinks.map((feedback) => [feedback.sessionId, feedback]));

  function navigate(href: string) {
    startTransition(() => {
      router.push(href as Route);
    });
  }

  function handleNavigationClick(href: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigate(href);
    };
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const participant = formData.get("participantId");
    const validation = formData.get("validation");

    params.set("tab", "all");

    if (typeof participant === "string" && participant !== "all") {
      params.set("participantId", participant);
    }

    if (typeof validation === "string" && validation !== "all") {
      params.set("validation", validation);
    }

    const query = params.toString();
    navigate(`/${locale}/dashboard/sessions${query ? `?${query}` : ""}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.allSessionsTitle}</CardTitle>
        <CardDescription>{dictionary.allSessionsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleFilterSubmit}
          className="mb-4 grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_12rem_auto_auto] md:items-end"
        >
          <div className="grid gap-2">
            <Label htmlFor="session-participant-filter">{dictionary.participant}</Label>
            <Select name="participantId" defaultValue={filters.practitionerId ?? "all"}>
              <SelectTrigger id="session-participant-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dictionary.allParticipants}</SelectItem>
                {participants.map((participant) => (
                  <SelectItem key={participant.practitionerId} value={participant.practitionerId}>
                    {participant.displayName || participant.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="session-validation-filter">{dictionary.validation}</Label>
            <Select name="validation" defaultValue={filters.validation ?? "all"}>
              <SelectTrigger id="session-validation-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dictionary.allValidation}</SelectItem>
                <SelectItem value="validated">{dictionary.validated}</SelectItem>
                <SelectItem value="pending">{dictionary.pending}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isPending}>
            {dictionary.applyFilters}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={resetHref as Route} onClick={handleNavigationClick(resetHref)}>
              {dictionary.clearFilters}
            </Link>
          </Button>
        </form>

        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.emptyAllSessions}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.date}</TableHead>
                  <TableHead>{dictionary.practitioner}</TableHead>
                  <TableHead>{dictionary.client}</TableHead>
                  <TableHead>{dictionary.location}</TableHead>
                  <TableHead>{dictionary.validation}</TableHead>
                  <TableHead>{dictionary.feedback}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{formatDate(locale, session.sessionDate)}</TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <span>{session.practitionerName || session.practitionerEmail}</span>
                        {session.practitionerEmail ? (
                          <span className="text-xs text-muted-foreground">{session.practitionerEmail}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{session.clientName ?? ""}</TableCell>
                    <TableCell>{session.location ?? ""}</TableCell>
                    <TableCell>
                      <Badge variant={session.isValidated ? "default" : "secondary"}>
                        {session.isValidated ? dictionary.validated : dictionary.pending}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {session.isValidated && feedbackBySessionId.get(session.id)?.submittedAt ? (
                        <SessionFeedbackDrawer
                          locale={locale}
                          feedback={feedbackBySessionId.get(session.id)!}
                          dictionary={feedbackDictionary}
                        />
                      ) : (
                        <Badge variant="secondary">{dictionary.feedbackUnavailable}</Badge>
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
