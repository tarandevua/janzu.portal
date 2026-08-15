export type TrainingLevel = "level_1" | "level_2";
export type TrainingRecordStatus = "claimed" | "verified" | "rejected";

export type TrainingRecord = {
  id: string;
  traineeUserId: string;
  level: TrainingLevel;
  cohort: string;
  location: string;
  startedOn: string;
  completedOn: string;
  teachingInstructorName: string;
  courseworkComplete: boolean;
  evidenceReference: string | null;
  notes: string | null;
  status: TrainingRecordStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TrainingRecordInput = Pick<
  TrainingRecord,
  | "level"
  | "cohort"
  | "location"
  | "startedOn"
  | "completedOn"
  | "teachingInstructorName"
  | "courseworkComplete"
  | "evidenceReference"
  | "notes"
>;
