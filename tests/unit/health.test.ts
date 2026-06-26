import { describe, expect, it } from "vitest";
import {
  createBasicHealthPayload,
  createDetailedHealthPayload,
  getMissingRequiredHealthEnv,
} from "@/server/services/health.service";

describe("health service", () => {
  it("creates a stable basic health payload", () => {
    const payload = createBasicHealthPayload({
      now: new Date("2026-06-27T10:00:00.000Z"),
      uptimeSeconds: 42,
    });

    expect(payload).toEqual({
      status: "ok",
      service: "janzu-community-portal",
      timestamp: "2026-06-27T10:00:00.000Z",
      uptimeSeconds: 42,
    });
  });

  it("reports missing required Render environment variables", () => {
    expect(getMissingRequiredHealthEnv({})).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);
  });

  it("marks detailed health ok when env and Supabase are ready", async () => {
    const payload = await createDetailedHealthPayload({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      },
      now: new Date("2026-06-27T10:00:00.000Z"),
      uptimeSeconds: 42,
      supabaseCheck: async () => ({
        ok: true,
        status: "ok",
        latencyMs: 12,
      }),
    });

    expect(payload.status).toBe("ok");
    expect(payload.checks.environment.ok).toBe(true);
    expect(payload.checks.supabase).toMatchObject({
      ok: true,
      status: "ok",
      latencyMs: 12,
    });
  });

  it("marks detailed health degraded and skips Supabase when env is missing", async () => {
    const payload = await createDetailedHealthPayload({
      env: {},
      now: new Date("2026-06-27T10:00:00.000Z"),
      uptimeSeconds: 42,
    });

    expect(payload.status).toBe("degraded");
    expect(payload.checks.environment.ok).toBe(false);
    expect(payload.checks.supabase.status).toBe("skipped");
  });
});
