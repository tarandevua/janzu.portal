import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WhatsAppConsentForm } from "@/features/practitioners/components/whatsapp-consent-form";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import type { PractitionerProfile } from "@/server/models/practitioner.model";

const { saveConsent, successToast, refresh } = vi.hoisted(() => ({
  saveConsent: vi.fn(), successToast: vi.fn(), refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/features/practitioners/actions", () => ({ saveWhatsAppConsentInline: saveConsent }));
vi.mock("sonner", () => ({ toast: { success: successToast, error: vi.fn() } }));

const profile = {
  id: "profile-303", userId: "user-303", publicGroup: "facilitator",
  bio: null, country: null, city: null, latitude: null, longitude: null,
  practiceLocations: [], languages: [], website: null, instagramUrl: null,
  facebookUrl: null, youtubeUrl: null, tiktokUrl: null, profileImageUrl: null,
  isPublic: false,
  visibility: { directory: "private", displayName: "private", profileImage: "private",
    bio: "private", languages: "private", location: "private", website: "private",
    socialLinks: "private", configuredAt: null },
  whatsapp: { number: "+37360123456", visibility: "community",
    grantedAt: "2026-08-27T10:00:00Z", policyVersion: "2026-08-27.v1" },
  createdAt: "2026-08-27T00:00:00Z", updatedAt: "2026-08-27T00:00:00Z",
} satisfies PractitionerProfile;

describe("WhatsAppConsentForm", () => {
  beforeEach(() => { saveConsent.mockReset(); successToast.mockReset(); refresh.mockReset(); });
  afterEach(cleanup);

  it.each([["en", en.practitioners.whatsapp], ["es", es.practitioners.whatsapp]] as const)(
    "renders explicit localized consent with no public option in %s",
    (locale, dictionary) => {
      render(<WhatsAppConsentForm locale={locale} profile={profile} dictionary={dictionary} />);
      expect(screen.getByLabelText(dictionary.consent)).toBeTruthy();
      expect(screen.queryByRole("option", { name: /public/i })).toBeNull();
      expect(screen.getByRole("button", { name: dictionary.revoke })).toBeTruthy();
    }
  );

  it("revokes without sending the retained number", async () => {
    saveConsent.mockResolvedValue({ ok: true, status: "revoked" });
    render(<WhatsAppConsentForm locale="en" profile={profile} dictionary={en.practitioners.whatsapp} />);
    fireEvent.click(screen.getByRole("button", { name: en.practitioners.whatsapp.revoke }));
    await waitFor(() => expect(saveConsent).toHaveBeenCalledOnce());
    const submitted = saveConsent.mock.calls[0][1] as FormData;
    expect(submitted.get("intent")).toBe("revoke");
    expect(successToast).toHaveBeenCalledWith(en.practitioners.whatsapp.revoked);
    expect(refresh).toHaveBeenCalledOnce();
  });
});
