export type TrainingLevel = "level_1" | "level_2" | "level_3";
export type TrainingRecordStatus = "claimed" | "verified" | "rejected";

export type TrainingSubject = {
  traineeUserId: string;
  displayName: string;
  profileImageUrl: string | null;
  activeAssignmentId: string | null;
  activeInstructorName: string | null;
};

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
  verifiedByName: string | null;
  verifiedUnderAssignmentId: string | null;
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

export function formatTrainingDate(value: string, locale: "en" | "es") {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function formatTrainingDateTime(value: string, locale: "en" | "es") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}
