import React from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  issueCertificateInline: vi.fn(),
  refresh: vi.fn(),
  loading: vi.fn(() => "certificate-toast"),
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
  issueCertificateInline: mocks.issueCertificateInline,
}));

import { CertificateIssueForm } from "@/features/certification/components/certificate-issue-form";

const dictionary = {
  issueCertificate: "Approve certification and issue certificate",
  statusMessages: {
    "certificate-issued": "Certificate issued.",
    "certificate-action-failed": "Certificate action failed.",
  },
};

describe("certificate issue AJAX form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(cleanup);

  it("blocks duplicate submissions while issuance is pending", async () => {
    let resolveAction: ((value: { ok: true; status: "certificate-issued" }) => void) | undefined;
    mocks.issueCertificateInline.mockReturnValue(new Promise((resolve) => {
      resolveAction = resolve;
    }));
    const { getByRole } = render(
      <CertificateIssueForm
        locale="en"
        journeyId="05595f66-2db5-4e75-9d10-8d891de71750"
        templateReady
        dictionary={dictionary}
      />
    );
    const button = getByRole("button") as HTMLButtonElement;

    fireEvent.click(button);
    fireEvent.click(button);

    expect(mocks.issueCertificateInline).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(button.disabled).toBe(true));

    resolveAction?.({ ok: true, status: "certificate-issued" });
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith(
      "Certificate issued.",
      { id: "certificate-toast" }
    ));
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("shows the server error in the toaster without navigating", async () => {
    mocks.issueCertificateInline.mockResolvedValue({
      ok: false,
      status: "certificate-template-unconfigured",
      message: "The approved certificate signature could not be loaded: Media object was not found.",
    });
    const { getByRole } = render(
      <CertificateIssueForm
        locale="en"
        journeyId="05595f66-2db5-4e75-9d10-8d891de71750"
        templateReady
        dictionary={dictionary}
      />
    );

    fireEvent.click(getByRole("button"));

    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith(
      "The approved certificate signature could not be loaded: Media object was not found.",
      { id: "certificate-toast" }
    ));
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
