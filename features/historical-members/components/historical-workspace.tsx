"use client";
import Link from "next/link";
import React, { useActionState, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { HistoricalClaim, HistoricalEvent } from "@/server/models/historical-member.model";
import { historicalMemberAction, type HistoricalActionState } from "@/features/historical-members/actions";
import type en from "@/messages/en.json";

type Copy = typeof en.historicalMembers;
const initial: HistoricalActionState = { status: "idle" };
const inputClass = "w-full min-w-0 rounded-md border bg-background p-2 text-sm";
const buttonClass = "rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50";
function Status({ state, copy }: { state: HistoricalActionState; copy: Copy }) {
  return <p role={state.status === "error" || state.status === "invalid" || state.status === "denied" ? "alert" : "status"} className="text-sm">{copy.results[state.status]}</p>;
}
function ImportForm({ locale, copy }: { locale: Locale; copy: Copy }) {
  const [state, action, pending] = useActionState(historicalMemberAction.bind(null, locale), initial);
  const [draft, setDraft] = useState("");
  const [previewed, setPreviewed] = useState<string | null>(null);
  const ready = state.status === "preview" && previewed === draft && state.report?.rows.every(row => row.code === "ready" || row.code === "replay");
  return <section className="space-y-3 rounded-lg border p-4">
    <h2 className="font-semibold">{copy.importTitle}</h2><p className="text-sm text-muted-foreground">{copy.importHelp}</p>
    <form action={action} className="space-y-3" onSubmit={() => setPreviewed(draft)}>
      <label className="block space-y-1"><span>{copy.importJson}</span><textarea name="rows" rows={10} required maxLength={750000} className={`${inputClass} font-mono`} value={draft} onChange={event => { setDraft(event.target.value); setPreviewed(null); }} /></label>
      <div className="flex flex-wrap gap-2"><button name="action" value="preview" disabled={pending} className={buttonClass}>{pending ? copy.working : copy.preview}</button>
      <button name="action" value="commit" disabled={pending || !ready} className={buttonClass}>{copy.commit}</button></div>
      <Status state={state} copy={copy} />
    </form>
    {state.report ? <ol className="space-y-1 text-sm" aria-label={copy.report}>{state.report.rows.map(row => <li key={row.index}>{new Intl.NumberFormat(locale).format(row.index)}: {copy.codes[row.code]} {row.claimId ? <Link className="underline" href={`/${locale}/dashboard/historical-members?claimId=${row.claimId}`}>{copy.openClaim}</Link> : null}</li>)}</ol> : null}
  </section>;
}
function ClaimForm({ claim, actor, admin, locale, copy }: { claim: HistoricalClaim; actor: string; admin: boolean; locale: Locale; copy: Copy }) {
  const [state, action, pending] = useActionState(historicalMemberAction.bind(null, locale), initial);
  const reviewer = claim.reviewer_user_id === actor;
  const canReview = (reviewer && claim.status === "pending_information") || (admin && actor !== claim.member_user_id && actor !== claim.reviewer_user_id && claim.status === "awaiting_admin");
  return <form action={action} className="space-y-3">
    <input type="hidden" name="id" value={claim.id} /><input type="hidden" name="revision" value={claim.revision} />
    <fieldset disabled={pending} className="space-y-3">
      <label className="block space-y-1"><span>{copy.reason}</span><textarea name="reason" required maxLength={1000} className={inputClass} rows={2} /></label>
      {admin && actor !== claim.member_user_id ? <details><summary className="cursor-pointer">{copy.assign}</summary><div className="space-y-2 py-2"><p className="text-sm">{copy.designationHelp}</p><label className="block">{copy.reviewerId}<input name="reviewerId" className={inputClass} /></label><button name="action" value="assign" className={buttonClass}>{copy.assign}</button></div></details> : null}
      {canReview ? <div className="space-y-3">
        <label className="block">{copy.decision}<select name="decision" className={inputClass}>{(["approved", "partially_approved", "pending_information", "rejected", "disputed"] as const).filter(value => claim.kind === "sessions" || value !== "partially_approved").map(value => <option key={value} value={value}>{copy.states[value]}</option>)}</select></label>
        <label className="block">{copy.approvedTotal}<input type="number" name="approvedTotal" min={0} max={claim.kind === "sessions" ? claim.details.claimedTotal : 0} defaultValue={0} className={inputClass} /></label>
        <label className="flex items-start gap-2"><input type="checkbox" name="noConflict" className="mt-1" /><span className="text-sm">{copy.noConflict}</span></label>
        <button name="action" value="review" className={buttonClass}>{copy.review}</button>
      </div> : null}
      {reviewer ? <button name="action" value="recuse" className={buttonClass}>{copy.recuse}</button> : null}
      {admin || actor === claim.member_user_id ? <details><summary className="cursor-pointer">{copy.revise}</summary><div className="space-y-2 py-2"><p className="text-sm">{copy.revisionHelp}</p><label className="block">{copy.detailsJson}<textarea name="details" rows={12} className={`${inputClass} font-mono`} defaultValue={JSON.stringify(claim.details, null, 2)} /></label><button name="action" value="revise" className={buttonClass}>{copy.revise}</button></div></details> : null}
    </fieldset>
    <Status state={state} copy={copy} />
  </form>;
}
export function HistoricalWorkspace({ locale, copy, claims, events, actor, admin, page, hasNext, focused }: {
  locale: Locale; copy: Copy; claims: HistoricalClaim[]; events: HistoricalEvent[]; actor: string; admin: boolean; page: number; hasNext: boolean; focused: boolean;
}) {
  return <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
    <p>{copy.description}</p><p className="text-sm text-muted-foreground">{copy.privacy}</p>
    <Link className="inline-block underline" href={`/${locale}/dashboard/knowledge-base/certification/historical-members`}>{copy.guide}</Link>
    {admin ? <ImportForm locale={locale} copy={copy} /> : null}
    <h2 className="text-lg font-semibold">{copy.claims}</h2>
    {claims.length === 0 ? <p role="status">{copy.empty}</p> : claims.map(claim => <article key={`${claim.id}-${claim.revision}`} id={`claim-${claim.id}`} className="space-y-4 rounded-lg border p-4">
      <div><h3 className="font-semibold">{copy.kinds[claim.kind]} · {copy.states[claim.status]}</h3><p className="break-all text-sm">{claim.source} / {claim.source_key}</p></div>
      <dl className="space-y-1 text-sm"><div><dt className="font-medium">{copy.memberId}</dt><dd className="break-all">{claim.member_user_id}</dd></div>
        <div><dt className="font-medium">{copy.reviewerId}</dt><dd className="break-all">{claim.reviewer_user_id ?? copy.unassigned}</dd></div>
        <div><dt className="font-medium">{copy.approvedTotal}</dt><dd>{new Intl.NumberFormat(locale).format(claim.approved_total)}</dd></div>
        <div><dt className="font-medium">{copy.updated}</dt><dd>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(claim.updated_at))}</dd></div>
      </dl>
      {claim.kind === "facilitator" || claim.kind === "instructor" ? <p className="text-sm">{copy.rolesDeferred}</p> : null}
      <details><summary className="cursor-pointer">{copy.evidence}</summary><pre className="mt-2 whitespace-pre-wrap break-all rounded bg-muted p-3 text-xs">{JSON.stringify(claim.details, null, 2)}</pre></details>
      <Link className="inline-block text-sm underline" href={`/${locale}/dashboard/historical-members?claimId=${claim.id}`}>{copy.openClaim}</Link>
      <ClaimForm claim={claim} actor={actor} admin={admin} locale={locale} copy={copy} />
    </article>)}
    {focused ? <section className="space-y-3"><h2 className="font-semibold">{copy.history}</h2>{events.map(event => <details key={event.id} className="rounded border p-3"><summary className="cursor-pointer break-words">{copy.actions[event.action as keyof Copy["actions"]] ?? copy.history} · {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.occurred_at))}</summary><p className="mt-2 whitespace-pre-wrap break-words">{event.reason}</p><p className="break-all text-xs">{event.actor_user_id}</p><pre className="mt-2 whitespace-pre-wrap break-all text-xs">{JSON.stringify(event.snapshot.details, null, 2)}</pre></details>)}<Link href={`/${locale}/dashboard/historical-members`} className="underline">{copy.allClaims}</Link></section> : <nav className="flex gap-4" aria-label={copy.pagination}>{page > 1 ? <Link className="underline" href={`/${locale}/dashboard/historical-members?page=${page - 1}`}>{copy.previous}</Link> : null}{hasNext ? <Link className="underline" href={`/${locale}/dashboard/historical-members?page=${page + 1}`}>{copy.next}</Link> : null}</nav>}
  </div>;
}
