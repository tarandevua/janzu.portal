import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { SessionInput } from "@/server/models/session.model";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import {
  createSessionForPractitioner,
  listSessionsByPractitionerId,
} from "@/server/repositories/session.repository";

export async function requireSessionPractitionerId(
  supabase: SupabaseServerClient,
  userId: string
) {
  const profile = await getPractitionerProfileByUserId(supabase, userId);

  if (!profile) {
    throw new Error("Practitioner profile is required before logging sessions.");
  }

  return profile.id;
}

export async function listMySessions(supabase: SupabaseServerClient, userId: string) {
  const practitionerId = await requireSessionPractitionerId(supabase, userId);
  return listSessionsByPractitionerId(supabase, practitionerId);
}

export async function createMySession(
  supabase: SupabaseServerClient,
  userId: string,
  input: SessionInput
) {
  const practitionerId = await requireSessionPractitionerId(supabase, userId);
  return createSessionForPractitioner(supabase, practitionerId, input);
}
