import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  ClientFollowUpFilter,
  ClientInput,
  ClientLifecycleStatus,
  ClientOutreachInput,
} from "@/server/models/client.model";
import {
  createClientForPractitioner,
  deleteClientForPractitioner,
  getClientByPractitionerId,
  listClientsByPractitionerId,
  listClientsByPractitionerIdPage,
  updateClientForPractitioner,
} from "@/server/repositories/client.repository";
import {
  completeClientFollowUp,
  createClientOutreach,
  deleteClientOutreach,
  listClientOutreachPage,
  rescheduleClientFollowUp,
  updateClientOutreach,
} from "@/server/repositories/client-outreach.repository";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";

export class PractitionerProfileRequiredError extends Error {
  constructor() {
    super("Practitioner profile is required before managing session participants.");
    this.name = "PractitionerProfileRequiredError";
  }
}

export async function requirePractitionerId(
  supabase: SupabaseServerClient,
  userId: string
) {
  const profile = await getPractitionerProfileByUserId(supabase, userId);

  if (!profile) {
    throw new PractitionerProfileRequiredError();
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
  pageSize = 10,
  lifecycleStatus?: ClientLifecycleStatus,
  followUpFilter: ClientFollowUpFilter = "all",
  today?: string
) {
  const practitionerId = await requirePractitionerId(supabase, userId);
  return listClientsByPractitionerIdPage(
    supabase,
    practitionerId,
    page,
    pageSize,
    lifecycleStatus,
    followUpFilter,
    today
  );
}

export async function getMyClient(supabase: SupabaseServerClient, userId: string, clientId: string) {
  const practitionerId = await requirePractitionerId(supabase, userId);
  return getClientByPractitionerId(supabase, practitionerId, clientId);
}

export async function listMyClientOutreachPage(
  supabase: SupabaseServerClient,
  userId: string,
  clientId: string,
  page = 1,
  pageSize = 20
) {
  const practitionerId = await requirePractitionerId(supabase, userId);
  const [client, outreach] = await Promise.all([
    getClientByPractitionerId(supabase, practitionerId, clientId),
    listClientOutreachPage(supabase, practitionerId, clientId, page, pageSize),
  ]);
  if (!client) return null;
  return { client, outreach };
}

export async function createMyClientOutreach(
  supabase: SupabaseServerClient,
  userId: string,
  clientId: string,
  input: ClientOutreachInput
) {
  const client = await getMyClient(supabase, userId, clientId);
  if (!client) throw new Error("Client not found.");
  return createClientOutreach(supabase, clientId, input);
}

export async function updateMyClientOutreach(
  supabase: SupabaseServerClient,
  userId: string,
  clientId: string,
  recordId: string,
  input: ClientOutreachInput
) {
  const practitionerId = await requirePractitionerId(supabase, userId);
  const client = await getClientByPractitionerId(supabase, practitionerId, clientId);
  if (!client) throw new Error("Client not found.");
  return updateClientOutreach(supabase, practitionerId, clientId, recordId, input);
}

export async function deleteMyClientOutreach(
  supabase: SupabaseServerClient,
  userId: string,
  clientId: string,
  recordId: string
) {
  const practitionerId = await requirePractitionerId(supabase, userId);
  const client = await getClientByPractitionerId(supabase, practitionerId, clientId);
  if (!client) throw new Error("Client not found.");
  return deleteClientOutreach(supabase, practitionerId, clientId, recordId);
}

export async function completeMyClientFollowUp(
  supabase: SupabaseServerClient,
  userId: string,
  clientId: string,
  recordId: string
) {
  const client = await getMyClient(supabase, userId, clientId);
  if (!client || client.nextFollowUp?.recordId !== recordId) throw new Error("Open follow-up not found.");
  return completeClientFollowUp(supabase, recordId);
}

export async function rescheduleMyClientFollowUp(
  supabase: SupabaseServerClient,
  userId: string,
  clientId: string,
  recordId: string,
  followUpOn: string
) {
  const client = await getMyClient(supabase, userId, clientId);
  if (!client || client.nextFollowUp?.recordId !== recordId) throw new Error("Open follow-up not found.");
  return rescheduleClientFollowUp(supabase, recordId, followUpOn);
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
