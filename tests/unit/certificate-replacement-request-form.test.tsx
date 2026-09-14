import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requestReplacement: vi.fn(),
  refresh: vi.fn(),
  loading: vi.fn(() => "replacement-toast"),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("sonner", () => ({
  toast: {
    loading: mocks.loading,
    success: mocks.success,
    error: mocks.error,
  },
}));
vi.mock("@/features/certification/actions", () => ({
  requestCertificateReplacementInline: mocks.requestReplacement,
}));

import { CertificateReplacementRequestForm } from "@/features/certification/components/certificate-replacement-request-form";

const dictionary = {
  replacementReason: "Replacement reason",
  replacementReasonPlaceholder: "Describe the correction",
  requestReplacement: "Request certificate replacement",
  statusMessages: {
    "certificate-replacement-requested": "The replacement request was sent.",
    "certificate-action-failed": "The replacement request could not be completed.",
  },
};

describe("certificate replacement request AJAX form", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("blocks a double click while the request is pending", async () => {
    let resolveAction: ((value: { ok: true; status: "certificate-replacement-requested" }) => void) | undefined;
    mocks.requestReplacement.mockReturnValue(new Promise((resolve) => {
      resolveAction = resolve;
    }));
    render(
      <CertificateReplacementRequestForm
        locale="en"
        certificateId="afb4fad5-ac90-4ce7-8fef-9d6f84a9edf3"
        dictionary={dictionary}
      />
    );
    fireEvent.change(screen.getByLabelText("Replacement reason"), {
      target: { value: "Please correct the name on my certificate." },
    });
    const button = screen.getByRole("button", { name: "Request certificate replacement" }) as HTMLButtonElement;

    fireEvent.click(button);
    fireEvent.click(button);

    expect(mocks.requestReplacement).toHaveBeenCalledOnce();
    await waitFor(() => expect(button.disabled).toBe(true));

    resolveAction?.({ ok: true, status: "certificate-replacement-requested" });
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith(
      "The replacement request was sent.",
      { id: "replacement-toast" }
    ));
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("shows an inline toast and keeps the page in place on failure", async () => {
    mocks.requestReplacement.mockResolvedValue({
      ok: false,
      status: "certificate-action-failed",
    });
    render(
      <CertificateReplacementRequestForm
        locale="en"
        certificateId="afb4fad5-ac90-4ce7-8fef-9d6f84a9edf3"
        dictionary={dictionary}
      />
    );
    fireEvent.change(screen.getByLabelText("Replacement reason"), {
      target: { value: "Please correct the name on my certificate." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request certificate replacement" }));

    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith(
      "The replacement request could not be completed.",
      { id: "replacement-toast" }
    ));
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
