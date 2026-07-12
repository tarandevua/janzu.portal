"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMyClient, updateMyClient } from "@/server/services/client.service";
import { clientSchema } from "@/server/validators/client.schema";

export type ClientActionState = {
  ok: boolean;
  status: "idle" | "created" | "updated" | "invalid";
  resultId: string | null;
};

const initialClientActionState: ClientActionState = {
  ok: false,
  status: "idle",
  resultId: null,
};

function clientActionResult(
  ok: ClientActionState["ok"],
  status: ClientActionState["status"]
): ClientActionState {
  return {
    ok,
    status,
    resultId: randomUUID(),
  };
}

export async function createClientInline(
  locale: Locale,
  _previousState: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
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
    country: formData.get("country"),
    city: formData.get("city"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return clientActionResult(false, "invalid");
  }

  await createMyClient(supabase, user.id, parsed.data);

  revalidatePath(`/${locale}/dashboard/clients`);
  return clientActionResult(true, "created");
}

export async function updateClientInline(
  locale: Locale,
  clientId: string,
  _previousState: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
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
    country: formData.get("country"),
    city: formData.get("city"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return clientActionResult(false, "invalid");
  }

  await updateMyClient(supabase, user.id, clientId, parsed.data);

  revalidatePath(`/${locale}/dashboard/clients`);
  return clientActionResult(true, "updated");
}

export async function createClient(locale: Locale, formData: FormData) {
  return createClientInline(locale, initialClientActionState, formData);
}

export async function updateClient(locale: Locale, clientId: string, formData: FormData) {
  return updateClientInline(locale, clientId, initialClientActionState, formData);
}
