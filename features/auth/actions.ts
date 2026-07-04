"use server";

import { redirect } from "next/navigation";
import { magicLinkSchema } from "@/features/auth/schemas";
import type { Locale } from "@/lib/i18n/config";
import { getClientEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMagicLinkLoginPolicy } from "@/server/services/platform-settings.service";

export type MagicLinkActionResult = {
  ok: boolean;
  status: "sent" | "invalid-email" | "unknown-user-disabled" | "error";
};

export async function sendMagicLink(locale: Locale, formData: FormData) {
  const result = await sendMagicLinkInline(locale, formData);

  redirect(`/${locale}/login?status=${result.status}`);
}

export async function sendMagicLinkInline(
  locale: Locale,
  formData: FormData
): Promise<MagicLinkActionResult> {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    return { ok: false, status: "invalid-email" };
  }

  const origin = getClientEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const supabase = await createSupabaseServerClient();
  const magicLinkPolicy = await getMagicLinkLoginPolicy(parsed.data.email);

  if (!magicLinkPolicy.isAllowed) {
    return { ok: false, status: "unknown-user-disabled" };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/${locale}/auth/callback?locale=${locale}`,
      shouldCreateUser: magicLinkPolicy.shouldCreateUser,
    }
  });

  if (error) {
    return { ok: false, status: "error" };
  }

  return { ok: true, status: "sent" };
}

export async function signOut(locale: Locale) {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  redirect(`/${locale}/login?status=signed-out`);
}
