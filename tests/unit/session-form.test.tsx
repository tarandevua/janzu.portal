import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionForm } from "@/features/sessions/components/session-form";
import en from "@/messages/en.json";

const { createSession, successToast, errorToast, refresh } = vi.hoisted(() => ({
  createSession: vi.fn(),
  successToast: vi.fn(),
  errorToast: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/features/sessions/actions", () => ({ createSession }));
vi.mock("sonner", () => ({ toast: { success: successToast, error: errorToast } }));
vi.mock("@/components/device-metadata-fields", () => ({ DeviceMetadataFields: () => null }));
vi.mock("@/features/sessions/components/session-client-picker", () => ({
  SessionClientPicker: () => <input name="newClientName" defaultValue="Test participant" />,
}));
vi.mock("@/features/sessions/components/session-date-picker", () => ({
  SessionDatePicker: () => <input name="sessionDate" defaultValue="2026-09-03" />,
}));

describe("SessionForm", () => {
  beforeEach(() => {
    createSession.mockReset();
    successToast.mockReset();
    errorToast.mockReset();
    refresh.mockReset();
  });
  afterEach(cleanup);

  it("logs a session without navigation and shows a success toast", async () => {
    createSession.mockResolvedValue({ ok: true, status: "created" });
    const onSuccess = vi.fn();
    const initialUrl = window.location.href;
    render(
      <SessionForm
        locale="en"
        clients={[]}
        dictionary={en.sessions}
        variant="plain"
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: en.sessions.create }));

    await waitFor(() => {
      expect(createSession).toHaveBeenCalledOnce();
      expect(successToast).toHaveBeenCalledWith(en.sessions.created);
      expect(onSuccess).toHaveBeenCalledOnce();
      expect(refresh).toHaveBeenCalledOnce();
    });
    expect(window.location.href).toBe(initialUrl);
  });

  it("shows invalid submissions only in the toaster", async () => {
    createSession.mockResolvedValue({ ok: false, status: "invalid" });
    render(<SessionForm locale="en" clients={[]} dictionary={en.sessions} variant="plain" />);

    fireEvent.click(screen.getByRole("button", { name: en.sessions.create }));

    await waitFor(() => expect(errorToast).toHaveBeenCalledWith(en.sessions.invalid));
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
