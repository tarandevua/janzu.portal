"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMyClient } from "@/server/services/client.service";
import { clientSchema } from "@/server/validators/client.schema";

export async function createClient(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/clients?status=invalid`);
  }

  await createMyClient(supabase, user.id, parsed.data);

  revalidatePath(`/${locale}/dashboard/clients`);
  redirect(`/${locale}/dashboard/clients?status=created`);
}
