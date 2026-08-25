import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  TrainingRecord,
  TrainingRecordInput,
  TrainingSubject,
} from "@/server/models/training.model";
import type { Database } from "@/types/database";

type TrainingRow = Database["public"]["Tables"]["training_history"]["Row"];
type ReviewArgs = Database["public"]["Functions"]["review_training_record"]["Args"];
type TrainingHistoryRow = Database["public"]["Functions"]["list_training_history"]["Returns"][number];
type TrainingSubjectRow = Database["public"]["Functions"]["get_training_history_subject"]["Returns"][number];

function toTrainingRecord(row: TrainingHistoryRow): TrainingRecord {
  return {
    id: row.id,
    traineeUserId: row.trainee_user_id,
    level: row.level,
    cohort: row.cohort,
    location: row.location,
    startedOn: row.started_on,
    completedOn: row.completed_on,
    teachingInstructorName: row.teaching_instructor_name,
    courseworkComplete: row.coursework_complete,
    evidenceReference: row.evidence_reference,
    notes: row.notes,
    status: row.status,
    verifiedBy: row.verified_by,
    verifiedByName: row.verified_by_name,
    verifiedUnderAssignmentId: row.verified_under_assignment_id,
    verifiedAt: row.verified_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTrainingSubject(row: TrainingSubjectRow): TrainingSubject {
  return {
    traineeUserId: row.trainee_user_id,
    displayName: row.display_name,
    profileImageUrl: row.profile_image_url,
    activeAssignmentId: row.active_assignment_id,
    activeInstructorName: row.active_instructor_name,
  };
}

export async function listTrainingRecords(
  supabase: SupabaseServerClient,
  actorUserId: string,
  traineeUserId: string
) {
  const client = supabase as unknown as {
    rpc(
      name: "list_training_history",
      args: Database["public"]["Functions"]["list_training_history"]["Args"]
    ): Promise<{ data: TrainingHistoryRow[] | null; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc("list_training_history", {
    actor_user_id: actorUserId,
    target_trainee_user_id: traineeUserId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toTrainingRecord);
}

export async function getTrainingSubject(
  supabase: SupabaseServerClient,
  actorUserId: string,
  traineeUserId: string
) {
  const client = supabase as unknown as {
    rpc(
      name: "get_training_history_subject",
      args: Database["public"]["Functions"]["get_training_history_subject"]["Args"]
    ): Promise<{ data: TrainingSubjectRow[] | null; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc("get_training_history_subject", {
    actor_user_id: actorUserId,
    target_trainee_user_id: traineeUserId,
  });
  if (error) throw new Error(error.message);

  const subject = data?.[0];
  if (!subject) throw new Error("The Trainee is unavailable.");
  return toTrainingSubject(subject);
}

export async function getCurrentVerifiedTrainingLevel(
  supabase: SupabaseServerClient,
  traineeUserId: string
) {
  const client = supabase as unknown as {
    rpc(
      name: "current_verified_training_level",
      args: Database["public"]["Functions"]["current_verified_training_level"]["Args"]
    ): Promise<{
      data: Database["public"]["Functions"]["current_verified_training_level"]["Returns"];
      error: { message: string } | null;
    }>;
  };
  const { data, error } = await client.rpc("current_verified_training_level", {
    target_trainee_user_id: traineeUserId,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function insertTrainingRecord(
  supabase: SupabaseServerClient,
  traineeUserId: string,
  input: TrainingRecordInput
) {
  const payload = {
    trainee_user_id: traineeUserId,
    level: input.level,
    cohort: input.cohort,
    location: input.location,
    started_on: input.startedOn,
    completed_on: input.completedOn,
    teaching_instructor_name: input.teachingInstructorName,
    coursework_complete: input.courseworkComplete,
    evidence_reference: input.evidenceReference,
    notes: input.notes,
  } satisfies Database["public"]["Tables"]["training_history"]["Insert"];
  const { data, error } = await supabase
    .from("training_history")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toTrainingRecord({ ...(data as TrainingRow), verified_by_name: null });
}

export async function correctTrainingRecord(
  supabase: SupabaseServerClient,
  traineeUserId: string,
  recordId: string,
  input: TrainingRecordInput
) {
  const payload = {
    level: input.level,
    cohort: input.cohort,
    location: input.location,
    started_on: input.startedOn,
    completed_on: input.completedOn,
    teaching_instructor_name: input.teachingInstructorName,
    coursework_complete: input.courseworkComplete,
    evidence_reference: input.evidenceReference,
    notes: input.notes,
    status: "claimed" as const,
    verified_by: null,
    verified_under_assignment_id: null,
    verified_at: null,
    rejection_reason: null,
  } satisfies Database["public"]["Tables"]["training_history"]["Update"];
  const { data, error } = await supabase
    .from("training_history")
    .update(payload as never)
    .eq("id", recordId)
    .eq("trainee_user_id", traineeUserId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toTrainingRecord({ ...(data as TrainingRow), verified_by_name: null });
}

export async function reviewTrainingRecord(
  supabase: SupabaseServerClient,
  actorUserId: string,
  recordId: string,
  approve: boolean,
  reason: string | null
) {
  const client = supabase as unknown as {
    rpc(
      name: "review_training_record",
      args: ReviewArgs
    ): Promise<{ data: TrainingRow | null; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc("review_training_record", {
    actor_user_id: actorUserId,
    target_record_id: recordId,
    approve_record: approve,
    review_reason: reason,
  });

  if (error || !data) throw new Error(error?.message ?? "Training review failed.");
  return toTrainingRecord({ ...data, verified_by_name: null });
}
