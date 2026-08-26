import { describe, expect, it } from "vitest";
import { isTrainingHistoryAccessDenied } from "@/server/services/training.service";
import {
  trainingCorrectionSchema,
  trainingRecordSchema,
  trainingReviewSchema,
} from "@/server/validators/training.schema";
import {
  formatTrainingDate,
  formatTrainingDateTime,
} from "@/server/models/training.model";

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
  it("accepts the Level 1, Level 2, and Level 3 data contract", () => {
    expect(trainingRecordSchema.parse(validRecord)).toMatchObject({
      level: "level_1",
      courseworkComplete: true,
      notes: null,
    });
    expect(trainingRecordSchema.parse({ ...validRecord, level: "level_2" }).level).toBe("level_2");
    expect(trainingRecordSchema.parse({ ...validRecord, level: "level_3" }).level).toBe("level_3");
  });

  it("rejects unknown levels and reversed dates", () => {
    expect(() => trainingRecordSchema.parse({ ...validRecord, level: "level_4" })).toThrow();
    expect(() => trainingRecordSchema.parse({
      ...validRecord,
      startedOn: "2026-05-10",
      completedOn: "2026-05-05",
    })).toThrow();
  });

  it("enforces the evidence and private-note storage limits", () => {
    expect(trainingRecordSchema.safeParse({
      ...validRecord,
      evidenceReference: "e".repeat(1001),
    }).success).toBe(false);
    expect(trainingRecordSchema.safeParse({
      ...validRecord,
      notes: "n".repeat(2001),
    }).success).toBe(false);
  });

  it("validates corrections with a record id", () => {
    expect(trainingCorrectionSchema.safeParse({
      ...validRecord,
      recordId: "31000000-0000-4000-8000-000000000001",
    }).success).toBe(true);
  });
});

describe("training date localization", () => {
  it("formats date-only values without shifting the calendar day", () => {
    expect(formatTrainingDate("2026-05-01", "en")).toContain("May 1, 2026");
    expect(formatTrainingDate("2026-05-01", "es")).toContain("1 may 2026");
  });

  it("formats verification timestamps in the active locale", () => {
    expect(formatTrainingDateTime("2026-05-01T13:30:00Z", "en")).toMatch(/May 1, 2026/);
    expect(formatTrainingDateTime("2026-05-01T13:30:00Z", "es")).toMatch(/1 may 2026/);
    expect(formatTrainingDateTime("2026-05-01T13:30:00Z", "en")).toContain("UTC");
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

describe("training history authorization errors", () => {
  it("recognizes the database and service denial without swallowing other failures", () => {
    expect(
      isTrainingHistoryAccessDenied(
        new Error("Training history access is not authorized")
      )
    ).toBe(true);
    expect(
      isTrainingHistoryAccessDenied(
        new Error("Training history access is not authorized.")
      )
    ).toBe(true);
    expect(isTrainingHistoryAccessDenied(new Error("Database connection failed"))).toBe(false);
    expect(isTrainingHistoryAccessDenied("Training history access is not authorized")).toBe(false);
  });
});
