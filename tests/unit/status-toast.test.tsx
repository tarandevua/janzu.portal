import React, { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StatusToast } from "@/components/status-toast";
import { statusToastVariant } from "@/lib/status-toast";

const mocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: mocks }));

describe("StatusToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("publishes a route status once after the toaster subscribes", () => {
    render(
      <StrictMode>
        <StatusToast message="Saved" status="saved" />
      </StrictMode>
    );

    act(() => vi.runAllTimers());
    expect(mocks.success).toHaveBeenCalledOnce();
    expect(mocks.success).toHaveBeenCalledWith("Saved", { id: "status-saved" });
  });

  it("routes failure statuses to error toasts", () => {
    render(<StatusToast message="Invalid" status="request-invalid" variant="error" />);
    act(() => vi.runAllTimers());
    expect(mocks.error).toHaveBeenCalledWith("Invalid", { id: "status-request-invalid" });
  });

  it("classifies common failure suffixes", () => {
    expect(statusToastVariant("delete-failed")).toBe("error");
    expect(statusToastVariant("review-saved")).toBe("success");
  });
});
