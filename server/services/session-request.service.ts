import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { SessionRequestInput } from "@/server/models/session-request.model";
import {
  createSessionRequest,
  listSessionRequestsByPractitionerId,
  updateSessionRequestStatus,
} from "@/server/repositories/session-request.repository";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";

export function submitPublicSessionRequest(
  supabase: SupabaseServerClient,
  input: SessionRequestInput
) {
  return createSessionRequest(supabase, input);
}

export function listMySessionRequests(
  supabase: SupabaseServerClient,
  practitionerId: string
) {
  return listSessionRequestsByPractitionerId(supabase, practitionerId);
}

export async function reviewMySessionRequest(
  supabase: SupabaseServerClient,
  userId: string,
  requestId: string,
  status: "accepted" | "declined"
) {
  const practitioner = await getPractitionerProfileByUserId(supabase, userId);

  if (!practitioner) {
    throw new Error("Practitioner profile is required.");
  }

  return updateSessionRequestStatus(supabase, requestId, practitioner.id, status);
}
