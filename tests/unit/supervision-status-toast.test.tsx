import React, { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SupervisionStatusToast } from "@/features/supervision/components/supervision-status-toast";

const { errorToast } = vi.hoisted(() => ({ errorToast: vi.fn() }));

vi.mock("sonner", () => ({
  toast: { error: errorToast },
}));

describe("SupervisionStatusToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    errorToast.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("publishes the access denial after the global toaster can subscribe", () => {
    render(
      <StrictMode>
        <SupervisionStatusToast
          status="training-access-denied"
          trainingAccessDeniedMessage="Training access denied"
        />
      </StrictMode>
    );

    expect(errorToast).not.toHaveBeenCalled();
    act(() => vi.runAllTimers());
    expect(errorToast).toHaveBeenCalledOnce();
    expect(errorToast).toHaveBeenCalledWith("Training access denied");
  });

  it("does not publish unrelated route statuses", () => {
    render(
      <SupervisionStatusToast
        status="accepted"
        trainingAccessDeniedMessage="Training access denied"
      />
    );

    act(() => vi.runAllTimers());
    expect(errorToast).not.toHaveBeenCalled();
  });
});
