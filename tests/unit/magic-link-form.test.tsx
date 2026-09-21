import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MagicLinkForm } from "@/features/auth/components/magic-link-form";

const mocks = vi.hoisted(() => ({
  error: vi.fn(),
  loading: vi.fn(),
  replace: vi.fn(),
  sendMagicLinkInline: vi.fn(),
  success: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.error,
    loading: mocks.loading,
    success: mocks.success,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/features/auth/actions", () => ({
  sendMagicLinkInline: mocks.sendMagicLinkInline,
}));

const dictionary = {
  title: "Sign in with magic link",
  description: "Enter your email and we will send a secure sign-in link.",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  submit: "Send magic link",
  sending: "Sending...",
  success: "Check your email.",
  successTitle: "Check your email",
  successDescription: "We sent a secure sign-in link to the email address below.",
  invalidEmail: "Enter a valid email.",
  genericError: "Try again.",
  authRequired: "Sign in to continue.",
  invalidLink: "That sign-in link is invalid or expired.",
  signedOut: "You have been signed out.",
  unknownUserDisabled: "This email is not registered.",
  deletedUser: "This account has been deactivated.",
};

describe("MagicLinkForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/en/login");
  });

  afterEach(cleanup);

  it("shows an expired magic-link fragment error for 12 seconds", async () => {
    window.history.replaceState(
      {},
      "",
      "/en/login#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"
    );

    render(<MagicLinkForm dictionary={dictionary} locale="en" />);

    await waitFor(() => {
      expect(mocks.error).toHaveBeenCalledWith(dictionary.invalidLink, { duration: 12_000 });
    });
    expect(mocks.replace).toHaveBeenCalledWith("/en/login");
  });

  it("replaces the login form with an in-memory success confirmation", async () => {
    mocks.loading.mockReturnValue("loading-toast");
    mocks.sendMagicLinkInline.mockResolvedValue({ ok: true, status: "sent" });

    render(<MagicLinkForm dictionary={dictionary} locale="en" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send magic link" }).closest("form")!);

    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeTruthy();
    expect(screen.getByText("person@example.com")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send magic link" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Sign in with magic link" })).toBeNull();
  });
});
