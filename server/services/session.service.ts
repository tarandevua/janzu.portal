import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { SessionCreationMetadata, SessionInput } from "@/server/models/session.model";
import { createClientForPractitioner } from "@/server/repositories/client.repository";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import {
  createSessionForPractitioner,
  listSessionsByPractitionerId,
} from "@/server/repositories/session.repository";
import { createFeedbackLinkForSession } from "@/server/repositories/feedback.repository";

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
  input: SessionInput,
  metadata?: SessionCreationMetadata
) {
  const practitionerId = await requireSessionPractitionerId(supabase, userId);
  const client =
    input.clientId || !input.newClientName
      ? null
      : await createClientForPractitioner(supabase, practitionerId, {
          name: input.newClientName,
        });
  const session = await createSessionForPractitioner(supabase, practitionerId, {
    ...input,
    clientId: input.clientId ?? client?.id ?? null,
  }, metadata);

  await createFeedbackLinkForSession(supabase, session.id);

  return session;
}
