import type { HistoricalImportRow } from "@/server/validators/historical-member.schema";
export type HistoricalStatus = "pending_information" | "awaiting_admin" | "approved" | "partially_approved" | "rejected" | "disputed";
export type HistoricalClaim = {
  id: string; member_user_id: string; source: string; source_key: string;
  kind: HistoricalImportRow["kind"]; details: HistoricalImportRow["details"];
  status: HistoricalStatus; revision: number; reviewer_user_id: string | null;
  senior_decision: string | null; senior_total: number | null; approved_total: number;
  decided_by: string | null; created_at: string; updated_at: string;
};
export type HistoricalEvent = {
  id: string; claim_id: string; revision: number; actor_user_id: string;
  action: string; reason: string; snapshot: HistoricalClaim; occurred_at: string;
};
export type ImportReport = {
  committed: boolean;
  rows: { index: number; code: "ready" | "replay" | "duplicate_identity" | "identity_mismatch" | "source_conflict" | "invalid"; claimId?: string }[];
};
