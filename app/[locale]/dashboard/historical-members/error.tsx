"use client";
import { useParams } from "next/navigation";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
export default function HistoricalMembersError({ reset }: { reset: () => void }) {
  const { locale } = useParams();
  const copy = (locale === "es" ? es : en).historicalMembers;
  return <div className="space-y-3 p-6"><p role="alert">{copy.loadError}</p><button onClick={reset} className="rounded border px-3 py-2">{copy.retry}</button></div>;
}
