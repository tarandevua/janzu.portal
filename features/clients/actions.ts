"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  completeMyClientFollowUp,
  createMyClient,
  createMyClientOutreach,
  deleteMyClientOutreach,
  rescheduleMyClientFollowUp,
  updateMyClient,
  updateMyClientOutreach,
} from "@/server/services/client.service";
import {
  clientFollowUpDateSchema,
  clientOutreachSchema,
  clientSchema,
} from "@/server/validators/client.schema";

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
    lifecycleStatus: formData.get("lifecycleStatus") || "prospect",
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
    lifecycleStatus: formData.get("lifecycleStatus") || "active",
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

export type OutreachActionState = {
  ok: boolean;
  status: "idle" | "created" | "updated" | "deleted" | "completed" | "rescheduled" | "invalid" | "failed";
  resultId: string | null;
};

const outreachResult = (ok: boolean, status: OutreachActionState["status"]): OutreachActionState => ({
  ok,
  status,
  resultId: randomUUID(),
});

async function requireActionUser(locale: Locale) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?status=auth-required`);
  return { supabase, user };
}

function parseOutreach(formData: FormData) {
  return clientOutreachSchema.safeParse({
    contactedOn: formData.get("contactedOn"),
    channel: formData.get("channel"),
    channelOther: formData.get("channelOther"),
    sessionOffered: formData.get("sessionOffered") === "on",
    response: formData.get("response"),
    responseOther: formData.get("responseOther"),
    notes: formData.get("notes"),
    followUpOn: formData.get("followUpOn"),
  });
}

export async function createOutreachInline(
  locale: Locale,
  clientId: string,
  _previous: OutreachActionState,
  formData: FormData
): Promise<OutreachActionState> {
  const parsed = parseOutreach(formData);
  if (!parsed.success) return outreachResult(false, "invalid");
  const { supabase, user } = await requireActionUser(locale);
  try {
    await createMyClientOutreach(supabase, user.id, clientId, parsed.data);
    revalidatePath(`/${locale}/dashboard/clients`);
    revalidatePath(`/${locale}/dashboard/clients/${clientId}`);
    return outreachResult(true, "created");
  } catch {
    return outreachResult(false, "failed");
  }
}

export async function updateOutreachInline(
  locale: Locale,
  clientId: string,
  recordId: string,
  _previous: OutreachActionState,
  formData: FormData
): Promise<OutreachActionState> {
  const parsed = parseOutreach(formData);
  if (!parsed.success) return outreachResult(false, "invalid");
  const { supabase, user } = await requireActionUser(locale);
  try {
    await updateMyClientOutreach(supabase, user.id, clientId, recordId, parsed.data);
    revalidatePath(`/${locale}/dashboard/clients`);
    revalidatePath(`/${locale}/dashboard/clients/${clientId}`);
    return outreachResult(true, "updated");
  } catch {
    return outreachResult(false, "failed");
  }
}

export async function deleteOutreachInline(locale: Locale, clientId: string, recordId: string) {
  const { supabase, user } = await requireActionUser(locale);
  try {
    await deleteMyClientOutreach(supabase, user.id, clientId, recordId);
    revalidatePath(`/${locale}/dashboard/clients`);
    revalidatePath(`/${locale}/dashboard/clients/${clientId}`);
    return outreachResult(true, "deleted");
  } catch {
    return outreachResult(false, "failed");
  }
}

export async function completeFollowUpInline(locale: Locale, clientId: string, recordId: string) {
  const { supabase, user } = await requireActionUser(locale);
  try {
    await completeMyClientFollowUp(supabase, user.id, clientId, recordId);
    revalidatePath(`/${locale}/dashboard/clients`);
    revalidatePath(`/${locale}/dashboard/clients/${clientId}`);
    return outreachResult(true, "completed");
  } catch {
    return outreachResult(false, "failed");
  }
}

export async function rescheduleFollowUpInline(
  locale: Locale,
  clientId: string,
  recordId: string,
  formData: FormData
) {
  const parsed = clientFollowUpDateSchema.safeParse({ followUpOn: formData.get("followUpOn") });
  if (!parsed.success) return outreachResult(false, "invalid");
  const { supabase, user } = await requireActionUser(locale);
  try {
    await rescheduleMyClientFollowUp(supabase, user.id, clientId, recordId, parsed.data.followUpOn);
    revalidatePath(`/${locale}/dashboard/clients`);
    revalidatePath(`/${locale}/dashboard/clients/${clientId}`);
    return outreachResult(true, "rescheduled");
  } catch {
    return outreachResult(false, "failed");
  }
}
