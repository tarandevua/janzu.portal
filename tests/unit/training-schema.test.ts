import { describe, expect, it } from "vitest";
import {
  trainingCorrectionSchema,
  trainingRecordSchema,
  trainingReviewSchema,
} from "@/server/validators/training.schema";

const validRecord = {
  level: "level_1",
  cohort: "L1 Moldova 2026",
  location: "Chisinau",
  startedOn: "2026-05-01",
  completedOn: "2026-05-05",
  teachingInstructorName: "Instructor One",
  courseworkComplete: "true",
  evidenceReference: "Cohort register 42",
  notes: "",
};

describe("trainingRecordSchema", () => {
  it("accepts the approved Level 1 and Level 2 data contract", () => {
    expect(trainingRecordSchema.parse(validRecord)).toMatchObject({
      level: "level_1",
      courseworkComplete: true,
      notes: null,
    });
    expect(trainingRecordSchema.parse({ ...validRecord, level: "level_2" }).level).toBe("level_2");
  });

  it("rejects Level 3 and reversed dates", () => {
    expect(() => trainingRecordSchema.parse({ ...validRecord, level: "level_3" })).toThrow();
    expect(() => trainingRecordSchema.parse({
      ...validRecord,
      startedOn: "2026-05-10",
      completedOn: "2026-05-05",
    })).toThrow();
  });

  it("validates corrections with a record id", () => {
    expect(trainingCorrectionSchema.safeParse({
      ...validRecord,
      recordId: "31000000-0000-4000-8000-000000000001",
    }).success).toBe(true);
  });
});

describe("trainingReviewSchema", () => {
  it("requires a reason for rejection", () => {
    expect(() => trainingReviewSchema.parse({
      recordId: "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
      decision: "reject",
      reason: "",
    })).toThrow();
  });
});
