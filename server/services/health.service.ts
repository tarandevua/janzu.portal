import type { SupabaseServerClient } from "@/lib/supabase/server";

export type HealthStatus = "ok" | "degraded";

export type HealthDependencyCheck = {
  ok: boolean;
  status: "ok" | "fail" | "skipped";
  latencyMs?: number;
  message?: string;
};

export type BasicHealthPayload = {
  status: "ok";
  service: string;
  timestamp: string;
  uptimeSeconds: number;
};

export type DetailedHealthPayload = {
  status: HealthStatus;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    app: HealthDependencyCheck;
    environment: HealthDependencyCheck & { missing: string[] };
    supabase: HealthDependencyCheck;
  };
};

const SERVICE_NAME = "janzu-community-portal";

const REQUIRED_RENDER_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

type BasicHealthOptions = {
  now?: Date;
  uptimeSeconds?: number;
};

type DetailedHealthOptions = BasicHealthOptions & {
  env?: Partial<NodeJS.ProcessEnv>;
  supabaseCheck?: () => Promise<HealthDependencyCheck>;
};

function getUptimeSeconds(uptimeSeconds?: number) {
  return uptimeSeconds ?? Math.round(process.uptime());
}

export function getMissingRequiredHealthEnv(env: Partial<NodeJS.ProcessEnv> = process.env) {
  return REQUIRED_RENDER_ENV.filter((key) => !env[key]);
}

export function createBasicHealthPayload(options: BasicHealthOptions = {}): BasicHealthPayload {
  const now = options.now ?? new Date();

  return {
    status: "ok",
    service: SERVICE_NAME,
    timestamp: now.toISOString(),
    uptimeSeconds: getUptimeSeconds(options.uptimeSeconds),
  };
}

export async function checkSupabaseReadiness(
  supabase: SupabaseServerClient
): Promise<HealthDependencyCheck> {
  const startedAt = Date.now();

  try {
    const { error } = await supabase
      .from("practitioners")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true)
      .limit(1);

    const latencyMs = Date.now() - startedAt;

    if (error) {
      return {
        ok: false,
        status: "fail",
        latencyMs,
        message: error.message,
      };
    }

    return {
      ok: true,
      status: "ok",
      latencyMs,
    };
  } catch (error) {
    return {
      ok: false,
      status: "fail",
      latencyMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : "Supabase readiness check failed.",
    };
  }
}

export async function createDetailedHealthPayload(
  options: DetailedHealthOptions = {}
): Promise<DetailedHealthPayload> {
  const now = options.now ?? new Date();
  const missingEnv = getMissingRequiredHealthEnv(options.env);
  const environmentOk = missingEnv.length === 0;
  const supabase =
    environmentOk && options.supabaseCheck
      ? await options.supabaseCheck()
      : {
          ok: false,
          status: "skipped" as const,
          message: environmentOk
            ? "Supabase check was not configured."
            : "Supabase check skipped because required environment variables are missing.",
        };

  const status: HealthStatus = environmentOk && supabase.ok ? "ok" : "degraded";

  return {
    status,
    service: SERVICE_NAME,
    timestamp: now.toISOString(),
    uptimeSeconds: getUptimeSeconds(options.uptimeSeconds),
    checks: {
      app: {
        ok: true,
        status: "ok",
      },
      environment: {
        ok: environmentOk,
        status: environmentOk ? "ok" : "fail",
        missing: missingEnv,
        message: environmentOk
          ? undefined
          : "Required environment variables are missing.",
      },
      supabase,
    },
  };
}
