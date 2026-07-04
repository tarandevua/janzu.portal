"use client";

import { useTransition } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LanguagesIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type LanguageSelectorProps = {
  locale: Locale;
  className?: string;
};

function buildLocalizedPath(pathname: string, locale: Locale, searchParams: URLSearchParams) {
  const segments = pathname.split("/");

  if (locales.includes(segments[1] as Locale)) {
    segments[1] = locale;
  } else {
    segments.splice(1, 0, locale);
  }

  const queryString = searchParams.toString();
  return `${segments.join("/") || `/${locale}`}${queryString ? `?${queryString}` : ""}`;
}

export function LanguageSelector({ locale, className }: LanguageSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleLocaleChange(nextLocale: string) {
    if (!locales.includes(nextLocale as Locale)) {
      return;
    }

    startTransition(() => {
      router.push(buildLocalizedPath(pathname, nextLocale as Locale, searchParams) as Route);
    });
  }

  return (
    <div className="relative z-[1000]">
      <Select value={locale} onValueChange={handleLocaleChange} disabled={isPending}>
        <SelectTrigger
          aria-label="Language"
          className={cn("h-9 w-[8.75rem] bg-background", className)}
        >
          <LanguagesIcon className="h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="z-[1000]">
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
