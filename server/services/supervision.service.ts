import type { SupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  adminAssignInstructor,
  endSupervision,
  listAvailableInstructors,
  listAvailableTrainees,
  listInstructorSupervisionDashboard,
  listSupervisionAssignments,
  requestSupervision,
  respondToSupervision,
} from "@/server/repositories/supervision.repository";
import { hasRole } from "@/server/services/rbac.service";
import type {
  SupervisionAssignment,
  SupervisionDashboardTrainee,
  SupervisionPerson,
} from "@/server/models/supervision.model";

export type SupervisionNextActionKey =
  | "reviewTraining"
  | "reviewSessionProgress"
  | "reviewLevel2Milestone"
  | "reviewAssessmentMilestone"
  | "reviewRevision"
  | "monitorJourney";

export function getSupervisionNextActionKey(
  trainee: Pick<SupervisionDashboardTrainee, "currentLevel" | "journeyState">
): SupervisionNextActionKey {
  if (!trainee.currentLevel || !trainee.journeyState || trainee.journeyState === "level_1_in_progress") {
    return "reviewTraining";
  }

  if (
    trainee.journeyState === "level_1_completed" ||
    trainee.journeyState === "practicum_in_progress" ||
    trainee.journeyState === "level_2_completed" ||
    trainee.journeyState === "advanced_practicum_in_progress"
  ) {
    return "reviewSessionProgress";
  }

  if (
    trainee.journeyState === "sessions_25_reached" ||
    trainee.journeyState === "level_2_review_eligible"
  ) {
    return "reviewLevel2Milestone";
  }

  if (
    trainee.journeyState === "sessions_50_reached" ||
    trainee.journeyState === "assessment_available" ||
    trainee.journeyState === "assessment_in_progress"
  ) {
    return "reviewAssessmentMilestone";
  }

  if (trainee.journeyState === "revision_required") return "reviewRevision";
  return "monitorJourney";
}

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
  const isInstructor = hasRole(roles, "instructor");
  const [assignments, instructors, trainees, dashboardTrainees] = await Promise.all([
    listSupervisionAssignments(supabase, actorUserId),
    canRequest || isAdmin ? listAvailableInstructors(supabase, actorUserId) : Promise.resolve([]),
    isAdmin ? listAvailableTrainees(supabase, actorUserId) : Promise.resolve([]),
    isInstructor
      ? listInstructorSupervisionDashboard(supabase, actorUserId)
      : Promise.resolve([]),
  ]);

  const requestableInstructors = canRequest
    ? listRequestableInstructors(instructors, assignments, actorUserId)
    : [];

  return { assignments, instructors, requestableInstructors, trainees, dashboardTrainees, roles };
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
