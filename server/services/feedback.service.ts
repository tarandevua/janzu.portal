import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { FeedbackInput } from "@/server/models/feedback.model";
import {
  createFeedbackLinkForSession,
  getFeedbackStatusByToken,
  getFeedbackByToken,
  listFeedbackBySessionIds,
  submitFeedbackByToken,
} from "@/server/repositories/feedback.repository";
import { requireSessionPractitionerId } from "@/server/services/session.service";

export async function createMySessionFeedbackLink(
  supabase: SupabaseServerClient,
  userId: string,
  sessionId: string
) {
  await requireSessionPractitionerId(supabase, userId);
  return createFeedbackLinkForSession(supabase, sessionId);
}

export async function findFeedbackLinkByToken(
  supabase: SupabaseServerClient,
  token: string
) {
  return getFeedbackByToken(supabase, token);
}

export async function findFeedbackStatusByToken(
  supabase: SupabaseServerClient,
  token: string
) {
  return getFeedbackStatusByToken(supabase, token);
}

export async function findFeedbackForSessions(
  supabase: SupabaseServerClient,
  sessionIds: string[]
) {
  return listFeedbackBySessionIds(supabase, sessionIds);
}

export async function submitPublicFeedback(
  supabase: SupabaseServerClient,
  token: string,
  input: FeedbackInput
) {
  return submitFeedbackByToken(supabase, token, input);
}
