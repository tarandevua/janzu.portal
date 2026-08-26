import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  CertificationJourney,
  CertificationJourneyState,
  CertificationOverride,
} from "@/server/models/certification.model";

type JourneyRow = Database["public"]["Tables"]["certification_journeys"]["Row"];
type JourneyListRow =
  Database["public"]["Functions"]["list_certification_journeys"]["Returns"][number];
type SyncArgs = Database["public"]["Functions"]["sync_certification_journey"]["Args"];
type ListArgs = Database["public"]["Functions"]["list_certification_journeys"]["Args"];
type OverrideArgs =
  Database["public"]["Functions"]["override_certification_journey_state"]["Args"];

type CertificationRpcClient = {
  rpc(
    functionName: "sync_certification_journey",
    args: SyncArgs
  ): Promise<{ data: JourneyRow | null; error: { message: string } | null }>;
  rpc(
    functionName: "list_certification_journeys",
    args: ListArgs
  ): Promise<{ data: JourneyListRow[] | null; error: { message: string } | null }>;
  rpc(
    functionName: "override_certification_journey_state",
    args: OverrideArgs
  ): Promise<{ data: JourneyRow | null; error: { message: string } | null }>;
};

function toJourney(
  row: JourneyRow | JourneyListRow,
  traineeName: string | null = null
): CertificationJourney {
  return {
    id: row.id,
    traineeUserId: row.trainee_user_id,
    practitionerId: row.practitioner_id,
    traineeName: "trainee_name" in row ? row.trainee_name : traineeName,
    state: row.state as CertificationJourneyState,
    countedSessionsCount: row.counted_sessions_count,
    level1TrainingRecordId: row.level_1_training_record_id,
    level2TrainingRecordId: row.level_2_training_record_id,
    stateChangedAt: row.state_changed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function syncCertificationJourney(
  supabase: SupabaseServerClient,
  actorUserId: string,
  traineeUserId: string
) {
  const rpcClient = supabase as unknown as CertificationRpcClient;
  const { data, error } = await rpcClient.rpc("sync_certification_journey", {
    actor_user_id: actorUserId,
    target_trainee_user_id: traineeUserId,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Certification journey could not be synchronized.");

  return toJourney(data);
}

export async function listCertificationJourneys(
  supabase: SupabaseServerClient,
  actorUserId: string
) {
  const rpcClient = supabase as unknown as CertificationRpcClient;
  const { data, error } = await rpcClient.rpc("list_certification_journeys", {
    actor_user_id: actorUserId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toJourney(row));
}

export async function overrideCertificationJourney(
  supabase: SupabaseServerClient,
  actorUserId: string,
  override: CertificationOverride
) {
  const rpcClient = supabase as unknown as CertificationRpcClient;
  const { data, error } = await rpcClient.rpc("override_certification_journey_state", {
    actor_user_id: actorUserId,
    target_journey_id: override.journeyId,
    expected_state: override.expectedState,
    resulting_state: override.resultingState,
    override_reason: override.reason,
    supporting_evidence_reference: override.evidenceReference,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Certification override could not be saved.");

  return toJourney(data);
}
