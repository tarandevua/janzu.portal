import { describe, expect, it, vi } from "vitest";
import { historicalActionSchema, historicalImportSchema } from "@/server/validators/historical-member.schema";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import { readFileSync } from "node:fs";

const row = {
  source: "school-2020", key: "member-1", memberId: "16010000-0000-4000-8000-000000000001", email: "MEMBER@example.test",
  kind: "training", details: { period: "2020", location: "Madrid", teachingInstructor: "Teacher", evidence: [], level: "level_1" },
};
describe("historical member contract", () => {
  it("allows incomplete claims for review and normalizes identity matching", () => {
    expect(historicalImportSchema.parse([row])[0]).toMatchObject({ email: "member@example.test", details: { declaration: "", identityEvidence: "" } });
  });
  it("rejects arbitrary sensitive fields, fake dates, fractional totals and unsupported roles", () => {
    for (const invalid of [
      { ...row, details: { ...row.details, participantName: "Private" } },
      { ...row, details: { ...row.details, startedOn: "2020-02-30" } },
      { ...row, kind: "admin" },
      { ...row, kind: "sessions", details: { ...row.details, coveredFrom: "2020-01-01", cutoff: "2020-02-01", claimedTotal: 1.5, calculationMethod: "logs" } },
    ]) expect(historicalImportSchema.safeParse([invalid]).success).toBe(false);
  });
  it("bounds batches and requires explicit independent review declarations", () => {
    expect(historicalImportSchema.safeParse([]).success).toBe(false);
    expect(historicalImportSchema.safeParse(Array(101).fill(row)).success).toBe(false);
    const review = { action: "review", id: row.memberId, revision: 1, decision: "approved", approvedTotal: 0, reason: "Primary source checked" };
    expect(historicalActionSchema.safeParse(review).success).toBe(false);
    expect(historicalActionSchema.safeParse({ ...review, noConflict: true }).success).toBe(true);
    expect(historicalActionSchema.safeParse({ ...review, noConflict: true, revision: 0 }).success).toBe(false);
  });
  it("maintains localized statuses, results and reporting codes", () => {
    const keys = (o: object): string[] => Object.entries(o).flatMap(([key, value]) => typeof value === "object" ? keys(value).map(child => `${key}.${child}`) : [key]);
    expect(keys(en.historicalMembers)).toEqual(keys(es.historicalMembers));
    for (const locale of ["en", "es"]) {
      const article = readFileSync(`content/knowledge-base/${locale}/certification/historical-members.mdx`, "utf8");
      const json = JSON.parse(article.match(/```json\n([\s\S]*?)\n```/)![1]);
      expect(historicalImportSchema.safeParse(json).success).toBe(true);
    }
  });
});

vi.mock("@/server/repositories/rbac.repository", () => ({ listUserRoles: vi.fn() }));
vi.mock("@/server/repositories/historical-member.repository", () => ({ importHistoricalClaims: vi.fn(), changeHistoricalClaim: vi.fn() }));
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { importHistoricalClaims } from "@/server/repositories/historical-member.repository";
import { importHistoricalMembers } from "@/server/services/historical-member.service";
import type { SupabaseServerClient } from "@/lib/supabase/server";

describe("historical import server authorization", () => {
  it("rejects an Instructor before any import repository call", async () => {
    vi.mocked(listUserRoles).mockResolvedValue(["instructor"]);
    await expect(importHistoricalMembers({} as SupabaseServerClient, row.memberId, [row], true)).rejects.toMatchObject({ code: "42501" });
    expect(importHistoricalClaims).not.toHaveBeenCalled();
  });
  it("validates and passes dry run and actor explicitly for an Administrator", async () => {
    vi.mocked(listUserRoles).mockResolvedValue(["admin"]);
    vi.mocked(importHistoricalClaims).mockResolvedValue({ committed: false, rows: [{ index: 1, code: "ready" }] });
    await importHistoricalMembers({} as SupabaseServerClient, row.memberId, [row], false);
    expect(importHistoricalClaims).toHaveBeenCalledWith({}, row.memberId, historicalImportSchema.parse([row]), false);
  });
});
