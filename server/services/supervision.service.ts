import type { SupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  adminAssignInstructor,
  endSupervision,
  listAvailableInstructors,
  listAvailableTrainees,
  listSupervisionAssignments,
  requestSupervision,
  respondToSupervision,
} from "@/server/repositories/supervision.repository";
import { hasRole } from "@/server/services/rbac.service";
import type {
  SupervisionAssignment,
  SupervisionPerson,
} from "@/server/models/supervision.model";

export function listRequestableInstructors(
  instructors: SupervisionPerson[],
  assignments: SupervisionAssignment[],
  traineeUserId: string
) {
  const unavailableInstructorIds = new Set(
    assignments
      .filter(
        (assignment) =>
          assignment.traineeUserId === traineeUserId &&
          (assignment.status === "pending" || assignment.status === "active")
      )
      .map((assignment) => assignment.instructorUserId)
  );

  return instructors.filter(
    (instructor) => !unavailableInstructorIds.has(instructor.userId)
  );
}

export async function getSupervisionWorkspace(
  supabase: SupabaseServerClient,
  actorUserId: string
) {
  const roles = await listUserRoles(supabase, actorUserId);
  const isAdmin = hasRole(roles, "admin");
  const canRequest = hasRole(roles, "apprentice");
  const [assignments, instructors, trainees] = await Promise.all([
    listSupervisionAssignments(supabase, actorUserId),
    canRequest || isAdmin ? listAvailableInstructors(supabase, actorUserId) : Promise.resolve([]),
    isAdmin ? listAvailableTrainees(supabase, actorUserId) : Promise.resolve([]),
  ]);

  const requestableInstructors = canRequest
    ? listRequestableInstructors(instructors, assignments, actorUserId)
    : [];

  return { assignments, instructors, requestableInstructors, trainees, roles };
}

export async function requestMyInstructor(
  supabase: SupabaseServerClient,
  actorUserId: string,
  instructorUserId: string
) {
  const roles = await listUserRoles(supabase, actorUserId);
  if (!hasRole(roles, "apprentice")) throw new Error("Trainee access is required.");
  return requestSupervision(supabase, actorUserId, instructorUserId);
}

export async function reviewInstructorRequest(
  supabase: SupabaseServerClient,
  actorUserId: string,
  assignmentId: string,
  accept: boolean
) {
  const roles = await listUserRoles(supabase, actorUserId);
  if (!hasRole(roles, "instructor")) throw new Error("Instructor access is required.");
  return respondToSupervision(supabase, actorUserId, assignmentId, accept);
}

export function endMySupervision(
  supabase: SupabaseServerClient,
  actorUserId: string,
  assignmentId: string,
  reason: string
) {
  return endSupervision(supabase, actorUserId, assignmentId, reason);
}

export async function assignInstructorAsAdmin(
  supabase: SupabaseServerClient,
  actorUserId: string,
  traineeUserId: string,
  instructorUserId: string,
  reason: string
) {
  const roles = await listUserRoles(supabase, actorUserId);
  if (!hasRole(roles, "admin")) throw new Error("Administrator access is required.");
  return adminAssignInstructor(
    supabase,
    actorUserId,
    traineeUserId,
    instructorUserId,
    reason
  );
}
