import Link from "next/link";
import type { Route } from "next";
import {
  BellIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  MapPinnedIcon,
  UserIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Locale } from "@/lib/i18n/config";
import type { ApprenticeDashboardData } from "@/server/services/apprentice-dashboard.service";

type ApprenticeDashboardDictionary = {
  profileReadiness: string;
  profileReadinessDescription: string;
  profileFields: string;
  editProfile: string;
  certificationProgress: string;
  validatedSessions: string;
  totalSessions: string;
  certificationRequired: string;
  submittedLocations: string;
  approvedLocations: string;
  pendingLocations: string;
  upcomingEvents: string;
  rsvps: string;
  unreadNotifications: string;
  recentLocations: string;
  recentLocationsDescription: string;
  communityEvents: string;
  communityEventsDescription: string;
  recentNotifications: string;
  recentNotificationsDescription: string;
  viewAll: string;
  emptyLocations: string;
  emptyEvents: string;
  emptyNotifications: string;
  name: string;
  status: string;
  date: string;
  location: string;
  publicProfile: string;
  privateProfile: string;
  notStarted: string;
  firstSteps: string;
  firstStepsDescription: string;
  continueFirstSteps: string;
  reviewFirstSteps: string;
};

type ApprenticeDashboardContentProps = {
  locale: Locale;
  data: ApprenticeDashboardData;
  dictionary: ApprenticeDashboardDictionary;
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

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full max-w-44" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-20" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function ApprenticeDashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <TableSkeleton />
          <TableSkeleton />
        </div>
        <TableSkeleton />
      </div>
    </div>
  );
}

export function ApprenticeDashboardContent({
  locale,
  data,
  dictionary,
}: ApprenticeDashboardContentProps) {
  const certificationPercent = data.certification?.percentComplete ?? 0;
  const certificationDescription = data.certification
    ? `${data.certification.validatedSessionsCount}/${data.certification.requiredSessionsCount} ${dictionary.certificationRequired}`
    : dictionary.notStarted;
  const showProfileReadiness =
    data.profileCompletion.completedFields < data.profileCompletion.totalFields;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{dictionary.firstSteps}</CardTitle>
              <CardDescription>{dictionary.firstStepsDescription}</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href={(data.onboarding.complete ? `/${locale}/dashboard/first-steps` : data.onboarding.nextHref) as Route}>
                {data.onboarding.complete ? dictionary.reviewFirstSteps : dictionary.continueFirstSteps}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {data.onboarding.completedCount}/{data.onboarding.totalCount}
            </div>
          </CardContent>
        </Card>
        {showProfileReadiness ? (
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{dictionary.profileReadiness}</CardTitle>
                <CardDescription>{dictionary.profileReadinessDescription}</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${locale}/dashboard/profile`}>{dictionary.editProfile}</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                aria-label={dictionary.profileReadiness}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={data.profileCompletion.percentComplete}
                className="h-3 overflow-hidden rounded-full bg-muted"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${data.profileCompletion.percentComplete}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {data.profileCompletion.completedFields}/{data.profileCompletion.totalFields}{" "}
                  {dictionary.profileFields}
                </span>
                <Badge variant={data.profile?.isPublic ? "default" : "secondary"}>
                  {data.profile?.isPublic ? dictionary.publicProfile : dictionary.privateProfile}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={dictionary.certificationProgress}
            value={`${certificationPercent}%`}
            description={certificationDescription}
            icon={CheckCircle2Icon}
          />
          <StatCard
            title={dictionary.validatedSessions}
            value={data.counts.validatedSessions}
            description={`${data.counts.sessions} ${dictionary.totalSessions}`}
            icon={ClipboardListIcon}
          />
          <StatCard
            title={dictionary.submittedLocations}
            value={data.counts.submittedLocations}
            description={`${data.counts.approvedLocations} ${dictionary.approvedLocations}`}
            icon={MapPinnedIcon}
          />
          <StatCard
            title={dictionary.upcomingEvents}
            value={data.counts.upcomingEvents}
            description={`${data.counts.rsvps} ${dictionary.rsvps}`}
            icon={CalendarDaysIcon}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title={dictionary.pendingLocations}
            value={data.counts.pendingLocations}
            description={dictionary.submittedLocations}
            icon={MapPinnedIcon}
          />
          <StatCard
            title={dictionary.unreadNotifications}
            value={data.counts.unreadNotifications}
            description={dictionary.recentNotificationsDescription}
            icon={BellIcon}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{dictionary.recentLocations}</CardTitle>
                <CardDescription>{dictionary.recentLocationsDescription}</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${locale}/dashboard/locations`}>{dictionary.viewAll}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.recentLocations.length === 0 ? (
                <p className="text-sm text-muted-foreground">{dictionary.emptyLocations}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{dictionary.name}</TableHead>
                      <TableHead>{dictionary.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentLocations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell>{location.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{location.status}</Badge>
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
                <CardTitle>{dictionary.communityEvents}</CardTitle>
                <CardDescription>{dictionary.communityEventsDescription}</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${locale}/events`}>{dictionary.viewAll}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">{dictionary.emptyEvents}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{dictionary.name}</TableHead>
                      <TableHead>{dictionary.date}</TableHead>
                      <TableHead>{dictionary.location}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.upcomingEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.title}</TableCell>
                        <TableCell>{formatDate(locale, event.startsAt)}</TableCell>
                        <TableCell>{event.locationName}</TableCell>
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
              <CardTitle>{dictionary.recentNotifications}</CardTitle>
              <CardDescription>{dictionary.recentNotificationsDescription}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/dashboard/notifications`}>{dictionary.viewAll}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dictionary.emptyNotifications}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dictionary.name}</TableHead>
                    <TableHead>{dictionary.date}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="flex items-center gap-2">
                        {!notification.readAt ? <UserIcon className="h-4 w-4 text-primary" /> : null}
                        <span>{notification.title}</span>
                      </TableCell>
                      <TableCell>{formatDate(locale, notification.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
