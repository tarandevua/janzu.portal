import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  CertificationApprovalCandidate,
  CertificationProgress,
} from "@/server/models/certification.model";

type CertificationRow = Database["public"]["Tables"]["certification_progress"]["Row"];
type SyncArgs = Database["public"]["Functions"]["sync_certification_progress"]["Args"];
type ApproveArgs = Database["public"]["Functions"]["approve_certification"]["Args"];
type ApprovalCandidateRow =
  Database["public"]["Functions"]["list_certification_approval_candidates"]["Returns"][number];
type ApprovalCandidatesArgs =
  Database["public"]["Functions"]["list_certification_approval_candidates"]["Args"];

type CertificationRpcClient = {
  rpc(
    functionName: "sync_certification_progress",
    args: SyncArgs
  ): Promise<{ data: CertificationRow | null; error: { message: string } | null }>;
  rpc(
    functionName: "approve_certification",
    args: ApproveArgs
  ): Promise<{ data: CertificationRow | null; error: { message: string } | null }>;
  rpc(
    functionName: "list_certification_approval_candidates",
    args: ApprovalCandidatesArgs
  ): Promise<{ data: ApprovalCandidateRow[] | null; error: { message: string } | null }>;
};

function toProgress(row: CertificationRow): CertificationProgress {
  return {
    id: row.id,
    practitionerId: row.practitioner_id,
    validatedSessionsCount: row.validated_sessions_count,
    requiredSessionsCount: row.required_sessions_count,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toApprovalCandidate(row: ApprovalCandidateRow): CertificationApprovalCandidate {
  return {
    id: row.id,
    practitionerId: row.practitioner_id,
    userId: row.user_id,
    practitionerName: row.practitioner_name,
    practitionerEmail: row.practitioner_email,
    country: row.country,
    city: row.city,
    validatedSessionsCount: row.validated_sessions_count,
    requiredSessionsCount: row.required_sessions_count,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    remainingSessionsCount: Math.max(
      row.required_sessions_count - row.validated_sessions_count,
      0
    ),
    percentComplete: Math.min(
      Math.round((row.validated_sessions_count / row.required_sessions_count) * 100),
      100
    ),
    isEligible: row.validated_sessions_count >= row.required_sessions_count,
  };
}

export async function syncCertificationProgress(
  supabase: SupabaseServerClient,
  practitionerId: string
) {
  const rpcClient = supabase as unknown as CertificationRpcClient;
  const { data, error } = await rpcClient.rpc("sync_certification_progress", {
    target_practitioner_id: practitionerId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Certification progress could not be synced.");
  }

  return toProgress(data);
}

export async function approveCertificationProgress(
  supabase: SupabaseServerClient,
  practitionerId: string,
  approverUserId: string
) {
  const rpcClient = supabase as unknown as CertificationRpcClient;
  const { data, error } = await rpcClient.rpc("approve_certification", {
    target_practitioner_id: practitionerId,
    approver_user_id: approverUserId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Certification approval failed.");
  }

  return toProgress(data);
}

export async function listCertificationApprovalCandidates(
  supabase: SupabaseServerClient,
  reviewerUserId: string
) {
  const rpcClient = supabase as unknown as CertificationRpcClient;
  const { data, error } = await rpcClient.rpc("list_certification_approval_candidates", {
    reviewer_user_id: reviewerUserId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toApprovalCandidate);
}
