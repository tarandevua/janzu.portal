import Link from "next/link";
import {
  BadgeCheckIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  FileTextIcon,
  MapPinnedIcon,
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
import type { AdminDashboardData } from "@/server/services/admin-dashboard.service";

type AdminDashboardDictionary = {
  users: string;
  usersDescription: string;
  practitioners: string;
  practitionersDescription: string;
  validatedSessions: string;
  validatedSessionsDescription: string;
  pendingReviews: string;
  pendingReviewsDescription: string;
  sessionRequests: string;
  feedback: string;
  upcomingEvents: string;
  pendingCertifications: string;
  recentSessions: string;
  recentSessionsDescription: string;
  recentFeedback: string;
  recentFeedbackDescription: string;
  pendingLocations: string;
  pendingLocationsDescription: string;
  certificationQueue: string;
  certificationQueueDescription: string;
  practitioner: string;
  date: string;
  location: string;
  validation: string;
  rating: string;
  feedbackText: string;
  name: string;
  type: string;
  progress: string;
  viewAll: string;
  empty: string;
  validated: string;
  pending: string;
  publicProfiles: string;
  totalSessions: string;
};

type DashboardUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

type AdminDashboardProps = {
  locale: Locale;
  access: RoleAccess[];
  user: DashboardUser;
  title: string;
  data: AdminDashboardData;
  dictionary: AdminDashboardDictionary;
};

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatLocationType(value: string) {
  return value.replaceAll("_", " ");
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

export function AdminDashboard({
  locale,
  access,
  user,
  title,
  data,
  dictionary,
}: AdminDashboardProps) {
  return (
    <JanzuDashboardFrame locale={locale} access={access} user={user} title={title}>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <StatCard
              title={dictionary.users}
              value={data.counts.users}
              description={dictionary.usersDescription}
              footer={`${data.counts.practitioners} ${dictionary.practitioners.toLowerCase()}`}
              icon={UsersIcon}
            />
            <StatCard
              title={dictionary.practitioners}
              value={data.counts.practitioners}
              description={dictionary.practitionersDescription}
              footer={`${data.counts.publicPractitioners} ${dictionary.publicProfiles}`}
              icon={BadgeCheckIcon}
            />
            <StatCard
              title={dictionary.validatedSessions}
              value={data.counts.validatedSessions}
              description={dictionary.validatedSessionsDescription}
              footer={`${data.counts.sessions} ${dictionary.totalSessions}`}
              icon={ClipboardListIcon}
            />
            <StatCard
              title={dictionary.pendingReviews}
              value={data.counts.pendingLocations + data.counts.pendingCertifications}
              description={dictionary.pendingReviewsDescription}
              footer={`${data.counts.pendingSessionRequests} ${dictionary.sessionRequests}`}
              icon={MapPinnedIcon}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title={dictionary.feedback}
              value={data.counts.submittedFeedback}
              description={dictionary.recentFeedbackDescription}
              footer={dictionary.validatedSessionsDescription}
              icon={FileTextIcon}
            />
            <StatCard
              title={dictionary.upcomingEvents}
              value={data.counts.upcomingEvents}
              description={dictionary.upcomingEvents}
              footer={dictionary.pendingReviewsDescription}
              icon={CalendarDaysIcon}
            />
            <StatCard
              title={dictionary.pendingCertifications}
              value={data.counts.pendingCertifications}
              description={dictionary.certificationQueueDescription}
              footer={dictionary.pendingReviewsDescription}
              icon={BadgeCheckIcon}
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
                        <TableRow key={feedback.feedbackId}>
                          <TableCell>
                            <div className="font-medium">{feedback.practitionerName}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(locale, feedback.submittedAt)}
                            </div>
                          </TableCell>
                          <TableCell>{feedback.rating}</TableCell>
                          <TableCell className="max-w-sm text-sm text-muted-foreground">
                            {feedback.experienceText ?? ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{dictionary.pendingLocations}</CardTitle>
                  <CardDescription>{dictionary.pendingLocationsDescription}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/${locale}/dashboard/locations`}>{dictionary.viewAll}</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.pendingLocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{dictionary.name}</TableHead>
                        <TableHead>{dictionary.type}</TableHead>
                        <TableHead>{dictionary.date}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.pendingLocations.map((location) => (
                        <TableRow key={location.id}>
                          <TableCell className="font-medium">{location.name}</TableCell>
                          <TableCell className="capitalize">{formatLocationType(location.locationType)}</TableCell>
                          <TableCell>{formatDate(locale, location.createdAt)}</TableCell>
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
                  <CardTitle>{dictionary.certificationQueue}</CardTitle>
                  <CardDescription>{dictionary.certificationQueueDescription}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/${locale}/dashboard/certification`}>{dictionary.viewAll}</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.certificationCandidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{dictionary.practitioner}</TableHead>
                        <TableHead>{dictionary.progress}</TableHead>
                        <TableHead>{dictionary.validation}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.certificationCandidates.map((candidate) => (
                        <TableRow key={candidate.id}>
                          <TableCell>
                            <div className="font-medium">{candidate.practitionerName}</div>
                            <div className="text-xs text-muted-foreground">{candidate.practitionerEmail}</div>
                          </TableCell>
                          <TableCell>
                            {candidate.validatedSessionsCount}/{candidate.requiredSessionsCount}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{candidate.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
