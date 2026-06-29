"use server";

import { redirect } from "next/navigation";
import { magicLinkSchema } from "@/features/auth/schemas";
import type { Locale } from "@/lib/i18n/config";
import { getClientEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMagicLinkLoginPolicy } from "@/server/services/platform-settings.service";

export async function sendMagicLink(locale: Locale, formData: FormData) {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    redirect(`/${locale}/login?status=invalid-email`);
  }

  const origin = getClientEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const supabase = await createSupabaseServerClient();
  const magicLinkPolicy = await getMagicLinkLoginPolicy(parsed.data.email);

  if (!magicLinkPolicy.isAllowed) {
    redirect(`/${locale}/login?status=unknown-user-disabled`);
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/${locale}/auth/callback?locale=${locale}`,
      shouldCreateUser: magicLinkPolicy.shouldCreateUser,
    }
  });

  if (error) {
    redirect(`/${locale}/login?status=error`);
  }

  redirect(`/${locale}/login?status=sent`);
}

export async function signOut(locale: Locale) {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  redirect(`/${locale}/login?status=signed-out`);
}
