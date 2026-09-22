import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, onClick, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props} onClick={(event) => { event.preventDefault(); onClick?.(event); }}>{children}</a>
  ),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/features/clients/components/client-edit-drawer", () => ({ ClientEditDrawer: () => <button>Edit</button> }));
vi.mock("@/components/dashboard/pagination-controls", () => ({ PaginationControls: () => null }));
vi.mock("@/features/clients/components/client-outreach-workspace", () => ({
  ClientOutreachDrawer: ({ loading }: { loading: boolean }) => loading ? <div>Loading outreach records</div> : <div>Outreach loaded</div>,
}));

import { ClientList } from "@/features/clients/components/client-list";

const dictionary = { ...en.clients, cancel: "Cancel", close: "Close" };

describe("ClientList management summary", () => {
  afterEach(cleanup);

  it("links each client to outreach and shows lifecycle and due state", () => {
    render(<ClientList
      locale="en" page={1} pageSize={10} totalCount={2} today="2026-09-22"
      previousHref="/previous" nextHref="/next" closeHref="/en/dashboard/clients?clientsPage=1" dictionary={dictionary}
      clients={[
        { id: "client-1", practitionerId: "p", name: "Prospect One", email: null, phone: null, country: null, city: null, notes: null, lifecycleStatus: "prospect", nextFollowUp: { recordId: "r1", followUpOn: "2026-09-21" }, createdAt: "", updatedAt: "" },
        { id: "client-2", practitionerId: "p", name: "Active Two", email: null, phone: null, country: null, city: null, notes: null, lifecycleStatus: "active", nextFollowUp: null, createdAt: "", updatedAt: "" },
      ]}
    />);

    expect(screen.getAllByRole("link", { name: "Manage outreach" })[0].getAttribute("href")).toBe("/en/dashboard/clients?clientsPage=1&outreachClientId=client-1");
    expect(screen.getAllByText("Prospect").length).toBeGreaterThan(0);
    expect(screen.getByText("Overdue")).toBeTruthy();
    expect(screen.getByText("No follow-up")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("link", { name: "Manage outreach" })[0]);
    expect(screen.getByText("Loading outreach records")).toBeTruthy();
  });
});
