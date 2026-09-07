import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { HistoricalWorkspace } from "@/features/historical-members/components/historical-workspace";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
vi.mock("@/features/historical-members/actions", () => ({ historicalMemberAction: vi.fn(async () => ({ status: "preview", report: { committed: false, rows: [{ index: 1, code: "ready" }] } })) }));
afterEach(cleanup);
const base = { claims: [], events: [], actor: "member", admin: true, page: 1, hasNext: false, focused: false };
describe("historical import workspace", () => {
  it("requires validation of the current draft before enabling commit", async () => {
    render(<HistoricalWorkspace {...base} locale="en" copy={en.historicalMembers} />);
    const commit = screen.getByRole("button", { name: en.historicalMembers.commit }) as HTMLButtonElement;
    expect(commit.disabled).toBe(true);
    const draft = screen.getByLabelText(en.historicalMembers.importJson);
    fireEvent.change(draft, { target: { value: "[]" } });
    fireEvent.submit(draft.closest("form")!);
    await waitFor(() => expect(commit.disabled).toBe(false));
    fireEvent.change(draft, { target: { value: "[{}]" } });
    expect(commit.disabled).toBe(true);
  });
  it("localizes the empty state and guide, and hides import from members", () => {
    render(<HistoricalWorkspace {...base} admin={false} locale="es" copy={es.historicalMembers} />);
    expect(screen.queryByRole("button", { name: es.historicalMembers.preview })).toBeNull();
    expect(screen.getByText(es.historicalMembers.empty)).toBeTruthy();
    expect(screen.getByRole("link", { name: es.historicalMembers.guide }).getAttribute("href")).toBe("/es/dashboard/knowledge-base/certification/historical-members");
  });
});
