import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { ClientInput } from "@/server/models/client.model";
import {
  createClientForPractitioner,
  deleteClientForPractitioner,
  listClientsByPractitionerId,
  listClientsByPractitionerIdPage,
  updateClientForPractitioner,
} from "@/server/repositories/client.repository";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";

export async function requirePractitionerId(
  supabase: SupabaseServerClient,
  userId: string
) {
  const profile = await getPractitionerProfileByUserId(supabase, userId);

  if (!profile) {
    throw new Error("Practitioner profile is required before managing clients.");
  }

  return profile.id;
}

export async function listMyClients(supabase: SupabaseServerClient, userId: string) {
  const practitionerId = await requirePractitionerId(supabase, userId);
  return listClientsByPractitionerId(supabase, practitionerId);
}

export async function listMyClientsPage(
  supabase: SupabaseServerClient,
  userId: string,
  page = 1,
  pageSize = 10
) {
  const practitionerId = await requirePractitionerId(supabase, userId);
  return listClientsByPractitionerIdPage(supabase, practitionerId, page, pageSize);
}

export async function createMyClient(
  supabase: SupabaseServerClient,
  userId: string,
  input: ClientInput
) {
  const practitionerId = await requirePractitionerId(supabase, userId);
  return createClientForPractitioner(supabase, practitionerId, input);
}

export async function updateMyClient(
  supabase: SupabaseServerClient,
  userId: string,
  clientId: string,
  input: ClientInput
) {
  const practitionerId = await requirePractitionerId(supabase, userId);
  return updateClientForPractitioner(supabase, practitionerId, clientId, input);
}

export async function deleteMyClient(
  supabase: SupabaseServerClient,
  userId: string,
  clientId: string
) {
  const practitionerId = await requirePractitionerId(supabase, userId);
  await deleteClientForPractitioner(supabase, practitionerId, clientId);
}
