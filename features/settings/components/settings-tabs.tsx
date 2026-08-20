"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/lib/i18n/config";

type SettingsDictionary = {
  preferencesTab: string;
  adminTab: string;
  preferencesTitle: string;
  preferencesDescription: string;
  languageLabel: string;
  languageDescription: string;
  themeLabel: string;
  themeDescription: string;
  english: string;
  spanish: string;
  system: string;
  light: string;
  dark: string;
};

type SettingsTabsProps = {
  locale: Locale;
  canManageAdminSettings: boolean;
  dictionary: SettingsDictionary;
  adminSettings?: ReactNode;
  emailPreferences: ReactNode;
};

function buildLocalizedPath(pathname: string, locale: Locale, searchParams: URLSearchParams) {
  const segments = pathname.split("/");

  if (segments[1] === "en" || segments[1] === "es") {
    segments[1] = locale;
  } else {
    segments.splice(1, 0, locale);
  }

  const queryString = searchParams.toString();
  return `${segments.join("/") || `/${locale}`}${queryString ? `?${queryString}` : ""}`;
}

const themeIcons = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
};

export function SettingsTabs({
  locale,
  canManageAdminSettings,
  dictionary,
  adminSettings,
  emailPreferences,
}: SettingsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const selectedTheme = isMounted ? theme ?? "system" : "system";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function handleLocaleChange(nextLocale: string) {
    if (nextLocale !== "en" && nextLocale !== "es") {
      return;
    }

    startTransition(() => {
      router.push(buildLocalizedPath(pathname, nextLocale, searchParams) as Route);
    });
  }

  return (
    <Tabs defaultValue="preferences" className="w-full">
      <TabsList>
        <TabsTrigger value="preferences">{dictionary.preferencesTab}</TabsTrigger>
        {canManageAdminSettings ? (
          <TabsTrigger value="admin">{dictionary.adminTab}</TabsTrigger>
        ) : null}
      </TabsList>

      <TabsContent value="preferences" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.preferencesTitle}</CardTitle>
            <CardDescription>{dictionary.preferencesDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="settings-language">{dictionary.languageLabel}</Label>
              <Select value={locale} onValueChange={handleLocaleChange} disabled={isPending}>
                <SelectTrigger id="settings-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{dictionary.english}</SelectItem>
                  <SelectItem value="es">{dictionary.spanish}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{dictionary.languageDescription}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="settings-theme">{dictionary.themeLabel}</Label>
              <Select value={selectedTheme} onValueChange={setTheme}>
                <SelectTrigger id="settings-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["system", "light", "dark"] as const).map((item) => {
                    const Icon = themeIcons[item];

                    return (
                      <SelectItem key={item} value={item}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {dictionary[item]}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{dictionary.themeDescription}</p>
            </div>
          </CardContent>
        </Card>
        <div className="mt-4">{emailPreferences}</div>
      </TabsContent>

      {canManageAdminSettings ? (
        <TabsContent value="admin" className="mt-4">
          {adminSettings}
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
