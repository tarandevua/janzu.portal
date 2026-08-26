import { describe, expect, it } from "vitest";
import { listRequestableInstructors } from "@/server/services/supervision.service";
import type {
  SupervisionAssignment,
  SupervisionPerson,
  SupervisionStatus,
} from "@/server/models/supervision.model";

const traineeUserId = "38ec640a-d72b-4c27-944e-3ff5e63d4b9c";
const otherTraineeUserId = "f7a1701c-90e8-40f0-aad1-75651d4d7387";

const instructors: SupervisionPerson[] = [
  { userId: "11111111-1111-4111-8111-111111111111", displayName: "Pending Instructor" },
  { userId: "22222222-2222-4222-8222-222222222222", displayName: "Active Instructor" },
  { userId: "33333333-3333-4333-8333-333333333333", displayName: "Available Instructor" },
];

function assignment(
  instructorUserId: string,
  status: SupervisionStatus,
  ownerUserId = traineeUserId
): SupervisionAssignment {
  return {
    id: crypto.randomUUID(),
    traineeUserId: ownerUserId,
    traineeName: "Trainee",
    instructorUserId,
    instructorName: "Instructor",
    status,
    requestedAt: "2026-08-26T00:00:00.000Z",
    respondedAt: null,
    endedAt: null,
    endReason: null,
    updatedAt: "2026-08-26T00:00:00.000Z",
  };
}

describe("listRequestableInstructors", () => {
  it("excludes instructors with this trainee's pending or active relationships", () => {
    const result = listRequestableInstructors(
      instructors,
      [
        assignment(instructors[0].userId, "pending"),
        assignment(instructors[1].userId, "active"),
      ],
      traineeUserId
    );

    expect(result).toEqual([instructors[2]]);
  });

  it("keeps ended relationships and relationships belonging to another trainee", () => {
    const result = listRequestableInstructors(
      instructors,
      [
        assignment(instructors[0].userId, "ended"),
        assignment(instructors[1].userId, "active", otherTraineeUserId),
      ],
      traineeUserId
    );

    expect(result).toEqual(instructors);
  });
});
