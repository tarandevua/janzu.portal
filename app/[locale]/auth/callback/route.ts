import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { getClientEnv } from "@/lib/env";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const verificationType = requestUrl.searchParams.get("type");
  const localeParam = requestUrl.searchParams.get("locale");
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const siteUrl = getClientEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const redirectTo = new URL(`/${locale}/dashboard`, siteUrl);
  let response = NextResponse.redirect(redirectTo);

  const isSupportedTokenType = verificationType === "invite" || verificationType === "magiclink";

  if (!code && (!tokenHash || !isSupportedTokenType)) {
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

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash as string,
        type: verificationType as "invite" | "magiclink",
      });

  if (error) {
    return NextResponse.redirect(new URL(`/${locale}/login?status=invalid-link`, siteUrl));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/login?status=invalid-link`, siteUrl));
  }

  const admin = createSupabaseAdminClient();
  const { data: portalUser, error: portalUserError } = await admin
    .from("users")
    .select("is_deleted")
    .eq("id", user.id)
    .maybeSingle();

  if (portalUserError || portalUser?.is_deleted) {
    response = NextResponse.redirect(new URL(`/${locale}/login?status=deleted-user`, siteUrl));
    await supabase.auth.signOut();

    return response;
  }

  return response;
}
