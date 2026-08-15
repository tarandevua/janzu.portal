import { after } from "next/server";
import type { ReactNode } from "react";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  claimWelcomeEmailForActivatedUser,
  deliverClaimedWelcomeEmail,
} from "@/server/services/welcome-email.service";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, supabase] = await Promise.all([
    params,
    createSupabaseServerClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const activationLocale = isLocale(locale) ? locale : defaultLocale;

  if (user) {
    const delivery = await claimWelcomeEmailForActivatedUser(user.id, activationLocale);

    if (delivery) {
      after(() => deliverClaimedWelcomeEmail(delivery));
    }
  }

  return children;
}
