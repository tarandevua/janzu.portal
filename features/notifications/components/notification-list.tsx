import Link from "next/link";
import type { Route } from "next";
import { BellIcon, CheckIcon, ExternalLinkIcon } from "lucide-react";
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
import { markNotificationRead } from "@/features/notifications/actions";
import type { Locale } from "@/lib/i18n/config";
import type { Notification } from "@/server/models/notification.model";

type NotificationDictionary = {
  listTitle: string;
  listDescription: string;
  empty: string;
  unread: string;
  read: string;
  createdAt: string;
  action: string;
  view: string;
  markRead: string;
  invalid: string;
};

type NotificationListProps = {
  locale: Locale;
  notifications: Notification[];
  unreadCount: number;
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

export function NotificationList({
  locale,
  notifications,
  unreadCount,
  status,
  dictionary,
}: NotificationListProps) {
  const markReadAction = markNotificationRead.bind(null, locale);

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
        <Badge variant={unreadCount > 0 ? "default" : "secondary"}>
          {unreadCount} {dictionary.unread}
        </Badge>
      </CardHeader>
      <CardContent>
        {status === "invalid" ? (
          <p className="mb-4 text-sm text-destructive">{dictionary.invalid}</p>
        ) : null}
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dictionary.listTitle}</TableHead>
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
                          <Badge variant={isUnread ? "default" : "outline"}>
                            {isUnread ? dictionary.unread : dictionary.read}
                          </Badge>
                        </div>
                        {notification.body ? (
                          <p className="max-w-2xl text-sm text-muted-foreground">
                            {notification.body}
                          </p>
                        ) : null}
                      </div>
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
        )}
      </CardContent>
    </Card>
  );
}
