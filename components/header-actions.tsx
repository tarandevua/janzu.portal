"use client";

import Link from "next/link";
import type { Route } from "next";
import { BellIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardNavigationLoading } from "@/components/dashboard/dashboard-navigation-loading";
import type { Locale } from "@/lib/i18n/config";

type HeaderActionsProps = {
  locale: Locale;
  unreadCount: number;
};

export function HeaderActions({ locale, unreadCount }: HeaderActionsProps) {
  const navigationLoading = useDashboardNavigationLoading();
  const notificationsHref = `/${locale}/dashboard/notifications`;

  return (
    <div className="ml-auto flex items-center gap-2">
      <Button asChild variant="ghost" size="icon" className="relative">
        <Link
          href={notificationsHref as Route}
          onClick={() => navigationLoading?.startNavigation(notificationsHref)}
        >
          <BellIcon className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Link>
      </Button>
    </div>
  );
}
