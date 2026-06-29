import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { getClientEnv } from "@/lib/env";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const localeParam = requestUrl.searchParams.get("locale");
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const siteUrl = getClientEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const redirectTo = new URL(`/${locale}/dashboard`, siteUrl);
  const response = NextResponse.redirect(redirectTo);

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/login?status=invalid-link`, siteUrl));
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/${locale}/login?status=invalid-link`, siteUrl));
  }

  return response;
}
