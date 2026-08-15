import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { TrainingRecordInput } from "@/server/models/training.model";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  correctTrainingRecord,
  insertTrainingRecord,
  listTrainingRecords,
  reviewTrainingRecord,
} from "@/server/repositories/training.repository";
import { hasAnyRole, hasRole } from "@/server/services/rbac.service";

export async function getTrainingWorkspace(
  supabase: SupabaseServerClient,
  actorUserId: string,
  targetTraineeUserId: string
) {
  const roles = await listUserRoles(supabase, actorUserId);
  if (targetTraineeUserId !== actorUserId && !hasAnyRole(roles, ["admin", "instructor"])) {
    throw new Error("Training history access is not authorized.");
  }

  const records = await listTrainingRecords(supabase, targetTraineeUserId);
  return {
    records,
    roles,
    canSubmit: targetTraineeUserId === actorUserId && hasRole(roles, "apprentice"),
    canReview: targetTraineeUserId !== actorUserId && hasAnyRole(roles, ["admin", "instructor"]),
  };
}

export async function correctMyTrainingRecord(
  supabase: SupabaseServerClient,
  actorUserId: string,
  recordId: string,
  input: TrainingRecordInput
) {
  const roles = await listUserRoles(supabase, actorUserId);
  if (!hasRole(roles, "apprentice")) throw new Error("Trainee access is required.");
  return correctTrainingRecord(supabase, actorUserId, recordId, input);
}

export async function submitMyTrainingRecord(
  supabase: SupabaseServerClient,
  actorUserId: string,
  input: TrainingRecordInput
) {
  const roles = await listUserRoles(supabase, actorUserId);
  if (!hasRole(roles, "apprentice")) throw new Error("Trainee access is required.");
  return insertTrainingRecord(supabase, actorUserId, input);
}

export async function reviewTraineeTrainingRecord(
  supabase: SupabaseServerClient,
  actorUserId: string,
  recordId: string,
  approve: boolean,
  reason: string | null
) {
  const roles = await listUserRoles(supabase, actorUserId);
  if (!hasAnyRole(roles, ["admin", "instructor"])) {
    throw new Error("Training review access is required.");
  }
  return reviewTrainingRecord(supabase, actorUserId, recordId, approve, reason);
}
