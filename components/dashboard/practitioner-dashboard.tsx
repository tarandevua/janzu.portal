import Link from "next/link";
import {
  CheckCircle2Icon,
  ClipboardListIcon,
  MapPinnedIcon,
  UsersIcon,
} from "lucide-react";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import type { PractitionerDashboardData } from "@/server/services/practitioner-dashboard.service";

type PractitionerDashboardDictionary = {
  setupTitle: string;
  setupDescription: string;
  setupAction: string;
  profileStatus: string;
  publicProfile: string;
  privateProfile: string;
  certificationProgress: string;
  validatedSessions: string;
  totalSessions: string;
  privateClients: string;
  pendingRequests: string;
  feedbackReceived: string;
  submittedLocations: string;
  approvedLocations: string;
  pendingLocations: string;
  recentSessions: string;
  recentRequests: string;
  recentFeedback: string;
  viewAll: string;
  emptySessions: string;
  emptyRequests: string;
  emptyFeedback: string;
  date: string;
  location: string;
  requestFrom: string;
  rating: string;
  certificationRequired: string;
};

type DashboardUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

type PractitionerDashboardProps = {
  locale: Locale;
  access: RoleAccess[];
  user: DashboardUser;
  title: string;
  data: PractitionerDashboardData | null;
  dictionary: PractitionerDashboardDictionary;
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
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof CheckCircle2Icon;
}) {
  return (
    <Card>
      <CardHeader className="relative">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
        <Icon className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
    </Card>
  );
}

export function PractitionerDashboard({
  locale,
  access,
  user,
  title,
  data,
  dictionary,
}: PractitionerDashboardProps) {
  return (
    <JanzuDashboardFrame locale={locale} access={access} user={user} title={title}>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          {!data ? (
            <Alert>
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <strong>{dictionary.setupTitle}</strong> {dictionary.setupDescription}
                </span>
                <Button asChild size="sm">
                  <Link href={`/${locale}/dashboard/profile`}>{dictionary.setupAction}</Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title={dictionary.profileStatus}
                  value={data.profile.isPublic ? dictionary.publicProfile : dictionary.privateProfile}
                  description={[data.profile.city, data.profile.country].filter(Boolean).join(", ") || user.email}
                  icon={UsersIcon}
                />
                <StatCard
                  title={dictionary.certificationProgress}
                  value={`${data.certification.percentComplete}%`}
                  description={`${data.certification.validatedSessionsCount}/${data.certification.requiredSessionsCount} ${dictionary.certificationRequired}`}
                  icon={CheckCircle2Icon}
                />
                <StatCard
                  title={dictionary.privateClients}
                  value={data.counts.clients}
                  description={`${data.counts.sessions} ${dictionary.totalSessions}`}
                  icon={UsersIcon}
                />
                <StatCard
                  title={dictionary.pendingRequests}
                  value={data.counts.pendingRequests}
                  description={`${data.counts.feedback} ${dictionary.feedbackReceived}`}
                  icon={ClipboardListIcon}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                  title={dictionary.validatedSessions}
                  value={data.counts.validatedSessions}
                  description={`${data.counts.sessions} ${dictionary.totalSessions}`}
                  icon={CheckCircle2Icon}
                />
                <StatCard
                  title={dictionary.submittedLocations}
                  value={data.counts.locations}
                  description={`${data.counts.approvedLocations} ${dictionary.approvedLocations}`}
                  icon={MapPinnedIcon}
                />
                <StatCard
                  title={dictionary.pendingLocations}
                  value={data.counts.pendingLocations}
                  description={dictionary.submittedLocations}
                  icon={MapPinnedIcon}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader className="flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>{dictionary.recentSessions}</CardTitle>
                      <CardDescription>{dictionary.totalSessions}</CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/${locale}/dashboard/sessions`}>{dictionary.viewAll}</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {data.recentSessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{dictionary.emptySessions}</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{dictionary.date}</TableHead>
                            <TableHead>{dictionary.location}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.recentSessions.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell>{formatDate(locale, session.sessionDate)}</TableCell>
                              <TableCell>{session.location ?? ""}</TableCell>
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
                      <CardTitle>{dictionary.recentRequests}</CardTitle>
                      <CardDescription>{dictionary.pendingRequests}</CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/${locale}/dashboard/sessions?tab=requests`}>{dictionary.viewAll}</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {data.recentRequests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{dictionary.emptyRequests}</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{dictionary.requestFrom}</TableHead>
                            <TableHead>{dictionary.date}</TableHead>
                            <TableHead>{dictionary.profileStatus}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.recentRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell>{request.requesterName}</TableCell>
                              <TableCell>
                                {request.preferredDate ? formatDate(locale, request.preferredDate) : ""}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{request.status}</Badge>
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
                    <CardTitle>{dictionary.recentFeedback}</CardTitle>
                    <CardDescription>{dictionary.feedbackReceived}</CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${locale}/dashboard/feedback`}>{dictionary.viewAll}</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {data.recentFeedback.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{dictionary.emptyFeedback}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{dictionary.date}</TableHead>
                          <TableHead>{dictionary.rating}</TableHead>
                          <TableHead>{dictionary.recentFeedback}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recentFeedback.map((feedback) => (
                          <TableRow key={feedback.feedbackId}>
                            <TableCell>{formatDate(locale, feedback.submittedAt)}</TableCell>
                            <TableCell>{feedback.rating}</TableCell>
                            <TableCell className="max-w-xl text-sm text-muted-foreground">
                              {feedback.experienceText ?? ""}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
