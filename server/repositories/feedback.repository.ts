import { randomBytes } from "node:crypto";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  DashboardFeedback,
  DashboardFeedbackPage,
  FeedbackInput,
  FeedbackParticipant,
  FeedbackSubmissionMetadata,
  FeedbackStatus,
  SessionFeedback,
} from "@/server/models/feedback.model";

type FeedbackRow = Database["public"]["Tables"]["session_feedback"]["Row"];
type SubmitFeedbackArgs = Database["public"]["Functions"]["submit_session_feedback"]["Args"];
type FeedbackStatusArgs = Database["public"]["Functions"]["get_session_feedback_status"]["Args"];
type FeedbackStatusRow = Database["public"]["Functions"]["get_session_feedback_status"]["Returns"][number];
type DashboardFeedbackArgs = Database["public"]["Functions"]["list_feedback_dashboard"]["Args"];
type DashboardFeedbackRow =
  Database["public"]["Functions"]["list_feedback_dashboard"]["Returns"][number];
type FeedbackParticipantArgs =
  Database["public"]["Functions"]["list_feedback_participants"]["Args"];
type FeedbackParticipantRow =
  Database["public"]["Functions"]["list_feedback_participants"]["Returns"][number];
type SubmitFeedbackRpcClient = {
  rpc(
    functionName: "submit_session_feedback",
    args: SubmitFeedbackArgs
  ): Promise<{ data: FeedbackRow | null; error: { message: string } | null }>;
};
type FeedbackStatusRpcClient = {
  rpc(
    functionName: "get_session_feedback_status",
    args: FeedbackStatusArgs
  ): Promise<{ data: FeedbackStatusRow[] | null; error: { message: string } | null }>;
};
type FeedbackDashboardRpcClient = {
  rpc(
    functionName: "list_feedback_dashboard",
    args: DashboardFeedbackArgs
  ): Promise<{ data: DashboardFeedbackRow[] | null; error: { message: string } | null }>;
  rpc(
    functionName: "list_feedback_participants",
    args: FeedbackParticipantArgs
  ): Promise<{ data: FeedbackParticipantRow[] | null; error: { message: string } | null }>;
};

function toFeedback(row: FeedbackRow): SessionFeedback {
  return {
    id: row.id,
    sessionId: row.session_id,
    token: row.token,
    participantEmail: row.participant_email,
    participantPreferredLanguage: row.participant_preferred_language,
    rating: row.rating,
    experienceText: row.experience_text,
    emotionalImpact: row.emotional_impact,
    feltInFacilitatorArms: row.felt_in_facilitator_arms,
    supportAtEnd: row.support_at_end,
    supportOtherText: row.support_other_text,
    continueWaterProcess: row.continue_water_process,
    interestedLearningJanzu: row.interested_learning_janzu,
    learningName: row.learning_name,
    learningPhone: row.learning_phone,
    anythingElse: row.anything_else,
    gdprAgreed: row.gdpr_agreed,
    submitterIp: row.submitter_ip,
    submitterUserAgent: row.submitter_user_agent,
    submitterDeviceId: row.submitter_device_id,
    submitterAcceptLanguage: row.submitter_accept_language,
    submitterReferrer: row.submitter_referrer,
    submitterMetadata: row.submitter_metadata,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toFeedbackStatus(row: FeedbackStatusRow): FeedbackStatus {
  return {
    token: row.token,
    submittedAt: row.submitted_at,
  };
}

function toDashboardFeedback(row: DashboardFeedbackRow): DashboardFeedback {
  return {
    feedbackId: row.feedback_id,
    sessionId: row.session_id,
    practitionerId: row.practitioner_id,
    practitionerUserId: row.practitioner_user_id,
    practitionerName: row.practitioner_name,
    practitionerEmail: row.practitioner_email,
    clientName: row.client_name,
    participantEmail: row.participant_email,
    sessionDate: row.session_date,
    rating: row.rating,
    experienceText: row.experience_text,
    emotionalImpact: row.emotional_impact,
    feltInFacilitatorArms: row.felt_in_facilitator_arms,
    supportAtEnd: row.support_at_end,
    supportOtherText: row.support_other_text,
    continueWaterProcess: row.continue_water_process,
    interestedLearningJanzu: row.interested_learning_janzu,
    learningName: row.learning_name,
    learningPhone: row.learning_phone,
    anythingElse: row.anything_else,
    gdprAgreed: row.gdpr_agreed,
    submittedAt: row.submitted_at,
  };
}

function toFeedbackParticipant(row: FeedbackParticipantRow): FeedbackParticipant {
  return {
    practitionerId: row.practitioner_id,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
  };
}

function uniqueFeedbackParticipants(participants: FeedbackParticipant[]) {
  const participantsByUserId = new Map<string, FeedbackParticipant>();

  for (const participant of participants) {
    if (!participantsByUserId.has(participant.userId)) {
      participantsByUserId.set(participant.userId, participant);
    }
  }

  return [...participantsByUserId.values()];
}

export function createFeedbackToken() {
  return randomBytes(24).toString("base64url");
}

export async function getFeedbackBySessionId(
  supabase: SupabaseServerClient,
  sessionId: string
) {
  const { data, error } = await supabase
    .from("session_feedback")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toFeedback(data) : null;
}

export async function listFeedbackBySessionIds(
  supabase: SupabaseServerClient,
  sessionIds: string[]
) {
  if (sessionIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("session_feedback")
    .select("*")
    .in("session_id", sessionIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toFeedback);
}

export async function listFeedbackDashboard(
  supabase: SupabaseServerClient,
  actorUserId: string,
  participantFilter?: string | null,
  page = 1,
  pageSize = 10,
  feedbackFilter?: string | null
): Promise<DashboardFeedbackPage> {
  const rpcClient = supabase as unknown as FeedbackDashboardRpcClient;
  const { data, error } = await rpcClient.rpc("list_feedback_dashboard", {
    actor_user_id: actorUserId,
    participant_filter: participantFilter ?? null,
    page_number: page,
    page_size: pageSize,
    feedback_filter: feedbackFilter ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    items: (data ?? []).map(toDashboardFeedback),
    totalCount: data?.[0]?.total_count ?? 0,
  };
}

export async function listFeedbackParticipants(
  supabase: SupabaseServerClient,
  actorUserId: string
) {
  const rpcClient = supabase as unknown as FeedbackDashboardRpcClient;
  const { data, error } = await rpcClient.rpc("list_feedback_participants", {
    actor_user_id: actorUserId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return uniqueFeedbackParticipants((data ?? []).map(toFeedbackParticipant));
}

export async function getFeedbackByToken(supabase: SupabaseServerClient, token: string) {
  const { data, error } = await supabase
    .from("session_feedback")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toFeedback(data) : null;
}

export async function getFeedbackStatusByToken(
  supabase: SupabaseServerClient,
  token: string
) {
  const rpcClient = supabase as unknown as FeedbackStatusRpcClient;
  const { data, error } = await rpcClient.rpc("get_session_feedback_status", {
    feedback_token: token,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = data?.[0];

  return row ? toFeedbackStatus(row) : null;
}

export async function createFeedbackLinkForSession(
  supabase: SupabaseServerClient,
  sessionId: string
) {
  const existing = await getFeedbackBySessionId(supabase, sessionId);

  if (existing) {
    return existing;
  }

  const payload = {
    session_id: sessionId,
    token: createFeedbackToken(),
    rating: 5,
  } satisfies Database["public"]["Tables"]["session_feedback"]["Insert"];

  const { data, error } = await supabase
    .from("session_feedback")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toFeedback(data);
}

export async function submitFeedbackByToken(
  supabase: SupabaseServerClient,
  token: string,
  input: FeedbackInput,
  metadata: FeedbackSubmissionMetadata = {}
) {
  const rpcClient = supabase as unknown as SubmitFeedbackRpcClient;
  const { data, error } = await rpcClient.rpc("submit_session_feedback", {
      feedback_token: token,
      feedback_participant_email: input.participantEmail,
      feedback_participant_preferred_language: input.participantPreferredLanguage,
      feedback_rating: input.rating,
      feedback_experience_text: input.experienceText ?? null,
      feedback_emotional_impact: input.emotionalImpact ?? null,
      feedback_felt_in_facilitator_arms: input.feltInFacilitatorArms ?? null,
      feedback_support_at_end: input.supportAtEnd,
      feedback_support_other_text: input.supportOtherText ?? null,
      feedback_continue_water_process: input.continueWaterProcess,
      feedback_interested_learning_janzu: input.interestedLearningJanzu,
      feedback_learning_name: input.learningName ?? null,
      feedback_learning_phone: input.learningPhone ?? null,
      feedback_anything_else: input.anythingElse ?? null,
      feedback_gdpr_agreed: input.gdprAgreed,
      feedback_submitter_ip: metadata.submitterIp ?? null,
      feedback_submitter_user_agent: metadata.submitterUserAgent ?? null,
      feedback_submitter_device_id: metadata.submitterDeviceId ?? null,
      feedback_submitter_accept_language: metadata.submitterAcceptLanguage ?? null,
      feedback_submitter_referrer: metadata.submitterReferrer ?? null,
      feedback_submitter_metadata: metadata.submitterMetadata ?? {},
    });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Feedback link is invalid or already submitted.");
  }

  return toFeedback(data);
}
