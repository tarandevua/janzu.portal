import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { FeedbackInput, FeedbackSubmissionMetadata } from "@/server/models/feedback.model";
import {
  createFeedbackLinkForSession,
  getFeedbackStatusByToken,
  getFeedbackByToken,
  listFeedbackBySessionIds,
  listFeedbackDashboard,
  listFeedbackParticipants,
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

export function findDashboardFeedback(
  supabase: SupabaseServerClient,
  actorUserId: string,
  participantFilter?: string | null,
  page?: number,
  pageSize?: number
) {
  return listFeedbackDashboard(supabase, actorUserId, participantFilter, page, pageSize);
}

export function findFeedbackParticipants(
  supabase: SupabaseServerClient,
  actorUserId: string
) {
  return listFeedbackParticipants(supabase, actorUserId);
}

export async function submitPublicFeedback(
  supabase: SupabaseServerClient,
  token: string,
  input: FeedbackInput,
  metadata?: FeedbackSubmissionMetadata
) {
  return submitFeedbackByToken(supabase, token, input, metadata);
}
