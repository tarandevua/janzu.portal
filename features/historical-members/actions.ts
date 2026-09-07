"use server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";
import type { ImportReport } from "@/server/models/historical-member.model";
import { actOnHistoricalMember, importHistoricalMembers } from "@/server/services/historical-member.service";

export type HistoricalActionState = { status: "idle" | "preview" | "saved" | "invalid" | "denied" | "error"; report?: ImportReport };
export async function historicalMemberAction(locale: Locale, _previous: HistoricalActionState, form: FormData): Promise<HistoricalActionState> {
  if (locale !== "en" && locale !== "es") return { status: "invalid" };
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { status: "denied" };
  try {
    const action = String(form.get("action"));
    if (action === "preview" || action === "commit") {
      const raw = String(form.get("rows") ?? "");
      if (raw.length > 750000) return { status: "invalid" };
      const report = await importHistoricalMembers(db, user.id, JSON.parse(raw), action === "commit");
      if (report.committed) revalidatePath(`/${locale}/dashboard/historical-members`);
      return { status: report.committed ? "saved" : "preview", report };
    }
    const command = {
      action, id: form.get("id"), revision: Number(form.get("revision")), reason: form.get("reason"),
      ...(action === "assign" ? { reviewerId: form.get("reviewerId") } : {}),
      ...(action === "review" ? { decision: form.get("decision"), approvedTotal: Number(form.get("approvedTotal")), noConflict: form.get("noConflict") === "on" } : {}),
      ...(action === "revise" ? { details: JSON.parse(String(form.get("details") ?? "")) } : {}),
    };
    await actOnHistoricalMember(db, user.id, command);
    for (const path of ["historical-members", "training", "certification", "supervision", "first-steps"]) revalidatePath(`/${locale}/dashboard/${path}`);
    return { status: "saved" };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "42501") return { status: "denied" };
    if (error instanceof ZodError || error instanceof SyntaxError || code === "23514" || code === "22023" || code === "22P02") return { status: "invalid" };
    // Only safe diagnostic codes; never evidence, declarations, contact data, or raw database messages.
    console.error("historical_member_action_failed", { code: typeof code === "string" ? code : "unknown" });
    return { status: "error" };
  }
}
