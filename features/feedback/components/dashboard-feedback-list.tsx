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
  email: string;
  rating: string;
  experienceText: string;
  emotionalImpact: string;
  feltInFacilitatorArms: string;
  supportAtEnd: string;
  supportOtherText: string;
  continueWaterProcess: string;
  interestedLearningJanzu: string;
  learningName: string;
  learningPhone: string;
  anythingElse: string;
  gdprAgreement: string;
  yes: string;
  no: string;
  supportYes: string;
  supportNotEnough: string;
  supportOther: string;
  continueAnotherSession: string;
  continueNoThankYou: string;
  details: string;
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
  selectedFeedbackId?: string;
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

function formatSupport(value: string | null, dictionary: FeedbackDashboardDictionary) {
  if (value === "yes") {
    return dictionary.supportYes;
  }

  if (value === "not_enough") {
    return dictionary.supportNotEnough;
  }

  if (value === "other") {
    return dictionary.supportOther;
  }

  return "";
}

function formatContinueProcess(value: string | null, dictionary: FeedbackDashboardDictionary) {
  if (value === "another_session") {
    return dictionary.continueAnotherSession;
  }

  if (value === "no_thank_you") {
    return dictionary.continueNoThankYou;
  }

  return "";
}

function DetailItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid gap-1 rounded-md border p-3">
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="text-sm leading-6">{value || ""}</dd>
    </div>
  );
}

function FeedbackDetailSheet({
  item,
  locale,
  dictionary,
  defaultOpen,
}: {
  item: DashboardFeedback;
  locale: Locale;
  dictionary: FeedbackDashboardDictionary;
  defaultOpen: boolean;
}) {
  return (
    <Sheet defaultOpen={defaultOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          {dictionary.details}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{dictionary.dashboardTitle}</SheetTitle>
          <SheetDescription>{formatDateTime(locale, item.submittedAt)}</SheetDescription>
        </SheetHeader>
        <dl className="mt-6 grid gap-3">
          <DetailItem label={dictionary.sessionDate} value={formatDate(locale, item.sessionDate)} />
          <DetailItem label={dictionary.client} value={item.clientName} />
          <DetailItem label={dictionary.email} value={item.participantEmail} />
          <DetailItem label={dictionary.rating} value={item.rating} />
          <DetailItem label={dictionary.feltInFacilitatorArms} value={item.feltInFacilitatorArms} />
          <DetailItem label={dictionary.experienceText} value={item.experienceText} />
          <DetailItem label={dictionary.supportAtEnd} value={formatSupport(item.supportAtEnd, dictionary)} />
          <DetailItem label={dictionary.supportOtherText} value={item.supportOtherText} />
          <DetailItem label={dictionary.anythingElse} value={item.anythingElse} />
          <DetailItem
            label={dictionary.continueWaterProcess}
            value={formatContinueProcess(item.continueWaterProcess, dictionary)}
          />
          <DetailItem
            label={dictionary.interestedLearningJanzu}
            value={item.interestedLearningJanzu ? dictionary.yes : dictionary.no}
          />
          <DetailItem label={dictionary.learningName} value={item.learningName} />
          <DetailItem label={dictionary.learningPhone} value={item.learningPhone} />
          <DetailItem label={dictionary.gdprAgreement} value={item.gdprAgreed ? dictionary.yes : dictionary.no} />
        </dl>
      </SheetContent>
    </Sheet>
  );
}

export function DashboardFeedbackList({
  locale,
  feedback,
  participants,
  selectedParticipantId,
  selectedFeedbackId,
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
                  <TableHead>{dictionary.submittedAt}</TableHead>
                  <TableHead>{dictionary.details}</TableHead>
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
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(locale, item.submittedAt)}
                    </TableCell>
                    <TableCell>
                      <FeedbackDetailSheet
                        item={item}
                        locale={locale}
                        dictionary={dictionary}
                        defaultOpen={item.feedbackId === selectedFeedbackId}
                      />
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
