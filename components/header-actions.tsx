"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { BellIcon, LanguagesIcon } from "lucide-react";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardNavigationLoading } from "@/components/dashboard/dashboard-navigation-loading";
import type { Locale } from "@/lib/i18n/config";

type HeaderActionsProps = {
  locale: Locale;
  unreadCount: number;
};

function getLocalizedHref(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/");

  if (segments[1] === "en" || segments[1] === "es") {
    segments[1] = nextLocale;
  } else {
    segments.splice(1, 0, nextLocale);
  }

  const localizedPath = segments.join("/") || `/${nextLocale}`;
  return localizedPath;
}

export function HeaderActions({ locale, unreadCount }: HeaderActionsProps) {
  const pathname = usePathname();
  const navigationLoading = useDashboardNavigationLoading();
  const nextLocale: Locale = locale === "en" ? "es" : "en";
  const languageHref = getLocalizedHref(pathname, nextLocale);
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
      <ThemeModeToggle />
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link
          href={languageHref as Route}
          onClick={() => navigationLoading?.startNavigation(languageHref)}
        >
          <LanguagesIcon className="h-4 w-4" />
          <span className="uppercase">{nextLocale}</span>
        </Link>
      </Button>
      
    </div>
  );
}
