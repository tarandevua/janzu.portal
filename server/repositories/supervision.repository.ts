import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  SupervisionAssignment,
  SupervisionPerson,
} from "@/server/models/supervision.model";
import type { Database } from "@/types/database";

type Functions = Database["public"]["Functions"];
type AssignmentRow = Functions["list_supervision_assignments"]["Returns"][number];
type PersonRow = Functions["list_available_instructors"]["Returns"][number];

type SupervisionRpcClient = {
  rpc(
    name: "list_supervision_assignments",
    args: Functions["list_supervision_assignments"]["Args"]
  ): Promise<{ data: AssignmentRow[] | null; error: { message: string } | null }>;
  rpc(
    name: "list_available_instructors" | "list_available_trainees",
    args: Functions["list_available_instructors"]["Args"]
  ): Promise<{ data: PersonRow[] | null; error: { message: string } | null }>;
  rpc(
    name: "request_supervision",
    args: Functions["request_supervision"]["Args"]
  ): Promise<{ error: { message: string } | null }>;
  rpc(
    name: "respond_to_supervision",
    args: Functions["respond_to_supervision"]["Args"]
  ): Promise<{ error: { message: string } | null }>;
  rpc(
    name: "end_supervision",
    args: Functions["end_supervision"]["Args"]
  ): Promise<{ error: { message: string } | null }>;
  rpc(
    name: "admin_assign_instructor",
    args: Functions["admin_assign_instructor"]["Args"]
  ): Promise<{ error: { message: string } | null }>;
};

function toAssignment(row: AssignmentRow): SupervisionAssignment {
  return {
    id: row.id,
    traineeUserId: row.trainee_user_id,
    traineeName: row.trainee_name,
    instructorUserId: row.instructor_user_id,
    instructorName: row.instructor_name,
    status: row.status,
    requestedAt: row.requested_at,
    respondedAt: row.responded_at,
    endedAt: row.ended_at,
    endReason: row.end_reason,
    updatedAt: row.updated_at,
  };
}

function toPerson(row: PersonRow): SupervisionPerson {
  return { userId: row.user_id, displayName: row.display_name };
}

export async function listSupervisionAssignments(
  supabase: SupabaseServerClient,
  actorUserId: string
) {
  const client = supabase as unknown as SupervisionRpcClient;
  const { data, error } = await client.rpc("list_supervision_assignments", {
    actor_user_id: actorUserId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toAssignment);
}

async function listPeople(
  supabase: SupabaseServerClient,
  actorUserId: string,
  kind: "list_available_instructors" | "list_available_trainees"
) {
  const client = supabase as unknown as SupervisionRpcClient;
  const { data, error } = await client.rpc(kind, { actor_user_id: actorUserId });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toPerson);
}

export function listAvailableInstructors(supabase: SupabaseServerClient, actorUserId: string) {
  return listPeople(supabase, actorUserId, "list_available_instructors");
}

export function listAvailableTrainees(supabase: SupabaseServerClient, actorUserId: string) {
  return listPeople(supabase, actorUserId, "list_available_trainees");
}

async function runMutation(
  promise: Promise<{ error: { message: string } | null }>
) {
  const { error } = await promise;
  if (error) throw new Error(error.message);
}

export function requestSupervision(
  supabase: SupabaseServerClient,
  actorUserId: string,
  instructorUserId: string
) {
  const client = supabase as unknown as SupervisionRpcClient;
  return runMutation(client.rpc("request_supervision", {
    actor_user_id: actorUserId,
    target_instructor_user_id: instructorUserId,
  }));
}

export function respondToSupervision(
  supabase: SupabaseServerClient,
  actorUserId: string,
  assignmentId: string,
  accept: boolean
) {
  const client = supabase as unknown as SupervisionRpcClient;
  return runMutation(client.rpc("respond_to_supervision", {
    actor_user_id: actorUserId,
    assignment_id: assignmentId,
    accept_request: accept,
  }));
}

export function endSupervision(
  supabase: SupabaseServerClient,
  actorUserId: string,
  assignmentId: string,
  reason: string
) {
  const client = supabase as unknown as SupervisionRpcClient;
  return runMutation(client.rpc("end_supervision", {
    actor_user_id: actorUserId,
    assignment_id: assignmentId,
    reason,
  }));
}

export function adminAssignInstructor(
  supabase: SupabaseServerClient,
  actorUserId: string,
  traineeUserId: string,
  instructorUserId: string,
  reason: string
) {
  const client = supabase as unknown as SupervisionRpcClient;
  return runMutation(client.rpc("admin_assign_instructor", {
    actor_user_id: actorUserId,
    target_trainee_user_id: traineeUserId,
    target_instructor_user_id: instructorUserId,
    reason,
  }));
}
