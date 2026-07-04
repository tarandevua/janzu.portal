"use client";

import Link from "next/link";
import type { Route } from "next";
import { BellIcon, ExternalLinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDashboardNavigationLoading } from "@/components/dashboard/dashboard-navigation-loading";
import type { Locale } from "@/lib/i18n/config";

type HeaderNotification = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  createdAtLabel: string;
};

type HeaderActionsProps = {
  locale: Locale;
  unreadCount: number;
  latestNotifications: HeaderNotification[];
  notificationCount: number;
  dictionary: {
    title: string;
    empty: string;
    unread: string;
    viewMore: string;
  };
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

export function HeaderActions({
  locale,
  unreadCount,
  latestNotifications,
  notificationCount,
  dictionary,
}: HeaderActionsProps) {
  const navigationLoading = useDashboardNavigationLoading();
  const notificationsHref = `/${locale}/dashboard/notifications`;
  const hasMoreNotifications = notificationCount > latestNotifications.length;

  return (
    <div className="ml-auto flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="relative">
          <BellIcon className="h-4 w-4" />
            <span className="sr-only">{dictionary.title}</span>
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(calc(100vw-2rem),24rem)] p-0">
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">{dictionary.title}</h2>
              {unreadCount > 0 ? (
                <Badge variant="secondary">
                  {unreadCount} {dictionary.unread}
                </Badge>
              ) : null}
            </div>
          </div>
          {latestNotifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">{dictionary.empty}</p>
          ) : (
            <div className="max-h-[22rem] overflow-y-auto">
              {latestNotifications.map((notification) => {
                const href = resolveNotificationHref(locale, notification.href);
                const content = (
                  <div className="flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent">
                    <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="line-clamp-1 block text-sm font-medium">
                        {notification.title}
                      </span>
                      {notification.body ? (
                        <span className="line-clamp-2 block text-xs text-muted-foreground">
                          {notification.body}
                        </span>
                      ) : null}
                      <span className="block text-xs text-muted-foreground">
                        {notification.createdAtLabel}
                      </span>
                    </span>
                    {href ? <ExternalLinkIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
                  </div>
                );

                return href ? (
                  <Link
                    key={notification.id}
                    href={href as Route}
                    onClick={() => navigationLoading?.startNavigation(href)}
                    className="block border-b last:border-b-0"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id} className="border-b last:border-b-0">
                    {content}
                  </div>
                );
              })}
            </div>
          )}
          {hasMoreNotifications ? (
            <div className="border-t p-2">
              <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                <Link
                  href={notificationsHref as Route}
                  onClick={() => navigationLoading?.startNavigation(notificationsHref)}
                >
                  {dictionary.viewMore}
                </Link>
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
