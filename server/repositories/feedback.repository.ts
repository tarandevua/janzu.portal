import { randomBytes } from "node:crypto";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { FeedbackInput, FeedbackStatus, SessionFeedback } from "@/server/models/feedback.model";

type FeedbackRow = Database["public"]["Tables"]["session_feedback"]["Row"];
type SubmitFeedbackArgs = Database["public"]["Functions"]["submit_session_feedback"]["Args"];
type FeedbackStatusArgs = Database["public"]["Functions"]["get_session_feedback_status"]["Args"];
type FeedbackStatusRow = Database["public"]["Functions"]["get_session_feedback_status"]["Returns"][number];
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

function toFeedback(row: FeedbackRow): SessionFeedback {
  return {
    id: row.id,
    sessionId: row.session_id,
    token: row.token,
    rating: row.rating,
    experienceText: row.experience_text,
    emotionalImpact: row.emotional_impact,
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
  input: FeedbackInput
) {
  const rpcClient = supabase as unknown as SubmitFeedbackRpcClient;
  const { data, error } = await rpcClient.rpc("submit_session_feedback", {
      feedback_token: token,
      feedback_rating: input.rating,
      feedback_experience_text: input.experienceText ?? null,
      feedback_emotional_impact: input.emotionalImpact ?? null,
    });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Feedback link is invalid or already submitted.");
  }

  return toFeedback(data);
}
