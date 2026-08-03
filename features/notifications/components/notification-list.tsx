"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { BellIcon, CheckCheckIcon, CheckIcon, ExternalLinkIcon } from "lucide-react";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/actions";
import type { Locale } from "@/lib/i18n/config";
import type { Notification } from "@/server/models/notification.model";

type NotificationDictionary = {
  listTitle: string;
  listDescription: string;
  empty: string;
  unread: string;
  read: string;
  participant: string;
  sessionDate: string;
  rating: string;
  status: string;
  createdAt: string;
  action: string;
  view: string;
  markRead: string;
  markAllRead: string;
  invalid: string;
  previous: string;
  next: string;
  page: string;
};

type NotificationListProps = {
  locale: Locale;
  notifications: Notification[];
  unreadCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  previousHref: string;
  nextHref: string;
  status?: string;
  dictionary: NotificationDictionary;
};

function resolveNotificationHref(locale: Locale, href: string | null) {
  if (!href) {
    return null;
  }

  if (href.startsWith("/dashboard")) {
    return `/${locale}${href}`;
  }

  if (href.startsWith("/")) {
    return `/${locale}${href}`;
  }

  return href;
}

function formatCreatedAt(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSessionDate(locale: Locale, value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function NotificationTableSkeleton({ dictionary }: { dictionary: NotificationDictionary }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{dictionary.listTitle}</TableHead>
            <TableHead>{dictionary.participant}</TableHead>
            <TableHead>{dictionary.sessionDate}</TableHead>
            <TableHead>{dictionary.rating}</TableHead>
            <TableHead>{dictionary.status}</TableHead>
            <TableHead>{dictionary.createdAt}</TableHead>
            <TableHead>{dictionary.action}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full max-w-xl" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell>
                <Skeleton className="h-4 w-36" />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}

export function NotificationList({
  locale,
  notifications,
  unreadCount,
  page,
  pageSize,
  totalCount,
  previousHref,
  nextHref,
  status,
  dictionary,
}: NotificationListProps) {
  const markReadAction = markNotificationRead.bind(null, locale);
  const markAllReadAction = markAllNotificationsRead.bind(null, locale);
  const [isPaginating, setIsPaginating] = useState(false);

  useEffect(() => {
    setIsPaginating(false);
  }, [notifications, page]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BellIcon className="h-5 w-5" />
            {dictionary.listTitle}
          </CardTitle>
          <CardDescription>{dictionary.listDescription}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={unreadCount > 0 ? "default" : "secondary"}>
            {unreadCount} {dictionary.unread}
          </Badge>
          {unreadCount > 0 ? (
            <form action={markAllReadAction}>
              <Button type="submit" variant="outline" size="sm">
                <CheckCheckIcon className="h-4 w-4" />
                {dictionary.markAllRead}
              </Button>
            </form>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {status === "invalid" ? (
          <p className="mb-4 text-sm text-destructive">{dictionary.invalid}</p>
        ) : null}
        {isPaginating ? (
          <NotificationTableSkeleton dictionary={dictionary} />
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.listTitle}</TableHead>
                  <TableHead>{dictionary.participant}</TableHead>
                  <TableHead>{dictionary.sessionDate}</TableHead>
                  <TableHead>{dictionary.rating}</TableHead>
                  <TableHead>{dictionary.status}</TableHead>
                  <TableHead>{dictionary.createdAt}</TableHead>
                  <TableHead>{dictionary.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => {
                  const href = resolveNotificationHref(locale, notification.href);
                  const isUnread = !notification.readAt;

                  return (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{notification.title}</span>
                          </div>
                          {notification.body ? (
                            <p className="max-w-2xl text-sm text-muted-foreground">
                              {notification.body}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {notification.participantName ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatSessionDate(locale, notification.feedbackSessionDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {notification.feedbackRating === null
                          ? "—"
                          : `${notification.feedbackRating}/5`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isUnread ? "default" : "outline"}>
                          {isUnread ? dictionary.unread : dictionary.read}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatCreatedAt(locale, notification.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {href ? (
                            <Button asChild variant="outline" size="sm">
                              <Link href={href as Route}>
                                <ExternalLinkIcon className="h-4 w-4" />
                                {dictionary.view}
                              </Link>
                            </Button>
                          ) : null}
                          {isUnread ? (
                            <form action={markReadAction}>
                              <input
                                type="hidden"
                                name="notificationId"
                                value={notification.id}
                              />
                              <Button type="submit" variant="secondary" size="sm">
                                <CheckIcon className="h-4 w-4" />
                                {dictionary.markRead}
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              previousHref={previousHref}
              nextHref={nextHref}
              onNavigate={() => setIsPaginating(true)}
              dictionary={dictionary}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
