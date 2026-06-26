import Link from "next/link";
import {
  BadgeCheckIcon,
  ClipboardListIcon,
  FileTextIcon,
  UsersIcon,
} from "lucide-react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Locale } from "@/lib/i18n/config";
import type { RoleAccess } from "@/server/models/rbac.model";
import type { FacilitatorDashboardData } from "@/server/services/facilitator-dashboard.service";

type FacilitatorDashboardDictionary = {
  practitioners: string;
  practitionersDescription: string;
  publicProfiles: string;
  sessions: string;
  sessionsDescription: string;
  validatedSessions: string;
  pendingRequests: string;
  feedback: string;
  feedbackDescription: string;
  upcomingEvents: string;
  upcomingEventsDescription: string;
  recentSessions: string;
  recentSessionsDescription: string;
  recentFeedback: string;
  recentFeedbackDescription: string;
  practitioner: string;
  date: string;
  duration: string;
  location: string;
  validation: string;
  rating: string;
  feedbackText: string;
  title: string;
  capacity: string;
  viewAll: string;
  empty: string;
  validated: string;
  pending: string;
};

type DashboardUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

type FacilitatorDashboardProps = {
  locale: Locale;
  access: RoleAccess[];
  user: DashboardUser;
  title: string;
  data: FacilitatorDashboardData;
  dictionary: FacilitatorDashboardDictionary;
};

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function StatCard({
  title,
  value,
  description,
  footer,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  footer: string;
  icon: typeof UsersIcon;
}) {
  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {value}
        </CardTitle>
        <Icon className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="font-medium">{description}</div>
        <div className="text-muted-foreground">{footer}</div>
      </CardFooter>
    </Card>
  );
}

export function FacilitatorDashboard({
  locale,
  access,
  user,
  title,
  data,
  dictionary,
}: FacilitatorDashboardProps) {
  return (
    <JanzuDashboardFrame locale={locale} access={access} user={user} title={title}>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="grid grid-cols-4 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <StatCard
              title={dictionary.practitioners}
              value={data.counts.practitioners}
              description={dictionary.practitionersDescription}
              footer={`${data.counts.publicPractitioners} ${dictionary.publicProfiles}`}
              icon={UsersIcon}
            />
            <StatCard
              title={dictionary.sessions}
              value={data.counts.sessions}
              description={dictionary.sessionsDescription}
              footer={`${data.counts.validatedSessions} ${dictionary.validatedSessions}`}
              icon={ClipboardListIcon}
            />
            <StatCard
              title={dictionary.pendingRequests}
              value={data.counts.pendingSessionRequests}
              description={dictionary.recentSessionsDescription}
              footer={dictionary.sessionsDescription}
              icon={BadgeCheckIcon}
            />
            <StatCard
              title={dictionary.feedback}
              value={data.counts.submittedFeedback}
              description={dictionary.feedbackDescription}
              footer={dictionary.validatedSessions}
              icon={FileTextIcon}
            />
          </div>

          <ChartAreaInteractive data={data.sessionActivity} locale={locale} />

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{dictionary.recentSessions}</CardTitle>
                  <CardDescription>{dictionary.recentSessionsDescription}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/${locale}/dashboard/sessions`}>{dictionary.viewAll}</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.recentSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{dictionary.practitioner}</TableHead>
                        <TableHead>{dictionary.date}</TableHead>
                        <TableHead>{dictionary.duration}</TableHead>
                        <TableHead>{dictionary.validation}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="font-medium">{session.practitionerName}</div>
                            <div className="text-xs text-muted-foreground">{session.practitionerEmail}</div>
                          </TableCell>
                          <TableCell>{formatDate(locale, session.sessionDate)}</TableCell>
                          <TableCell>{session.durationMinutes}</TableCell>
                          <TableCell>
                            <Badge variant={session.isValidated ? "default" : "secondary"}>
                              {session.isValidated ? dictionary.validated : dictionary.pending}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{dictionary.recentFeedback}</CardTitle>
                  <CardDescription>{dictionary.recentFeedbackDescription}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/${locale}/dashboard/feedback`}>{dictionary.viewAll}</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.recentFeedback.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{dictionary.practitioner}</TableHead>
                        <TableHead>{dictionary.rating}</TableHead>
                        <TableHead>{dictionary.feedbackText}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentFeedback.map((feedback) => (
                        <TableRow key={feedback.id}>
                          <TableCell>
                            <div className="font-medium">{feedback.practitionerName}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(locale, feedback.submittedAt)}
                            </div>
                          </TableCell>
                          <TableCell>{feedback.rating}</TableCell>
                          <TableCell className="max-w-sm text-sm text-muted-foreground">
                            {feedback.text ?? ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{dictionary.upcomingEvents}</CardTitle>
                <CardDescription>{dictionary.upcomingEventsDescription}</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${locale}/events`}>{dictionary.viewAll}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{dictionary.title}</TableHead>
                      <TableHead>{dictionary.location}</TableHead>
                      <TableHead>{dictionary.date}</TableHead>
                      <TableHead>{dictionary.capacity}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.upcomingEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>{event.locationName}</TableCell>
                        <TableCell>{formatDate(locale, event.startsAt)}</TableCell>
                        <TableCell>{event.capacity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
