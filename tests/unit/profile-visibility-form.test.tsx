import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileVisibilityForm } from "@/features/practitioners/components/profile-visibility-form";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import type { PractitionerProfile } from "@/server/models/practitioner.model";

const { saveVisibility, successToast, errorToast } = vi.hoisted(() => ({
  saveVisibility: vi.fn(),
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));

vi.mock("@/features/practitioners/actions", () => ({
  saveProfileVisibilityInline: saveVisibility,
}));

vi.mock("sonner", () => ({
  toast: { success: successToast, error: errorToast },
}));

const profile: PractitionerProfile = {
  id: "profile-301",
  userId: "user-301",
  publicGroup: "apprentice",
  displayName: "Trainee 301",
  bio: null,
  country: null,
  city: null,
  latitude: null,
  longitude: null,
  practiceLocations: [],
  languages: [],
  website: null,
  instagramUrl: null,
  facebookUrl: null,
  youtubeUrl: null,
  tiktokUrl: null,
  profileImageUrl: null,
  isPublic: false,
  visibility: {
    directory: "private",
    displayName: "private",
    profileImage: "private",
    bio: "private",
    languages: "private",
    location: "private",
    website: "private",
    socialLinks: "private",
    configuredAt: null,
  },
  createdAt: "2026-08-26T00:00:00Z",
  updatedAt: "2026-08-26T00:00:00Z",
};

describe("ProfileVisibilityForm", () => {
  beforeEach(() => {
    saveVisibility.mockReset();
    successToast.mockReset();
    errorToast.mockReset();
  });

  afterEach(cleanup);

  it("explains all field controls and omits public choices for a Trainee", () => {
    render(
      <ProfileVisibilityForm
        locale="en"
        profile={profile}
        canUsePublic={false}
        dictionary={en.practitioners.visibility}
      />
    );

    expect(screen.getAllByRole("combobox")).toHaveLength(8);
    expect(screen.queryAllByRole("option", { name: "Public" })).toHaveLength(0);
    expect(screen.getByText(en.practitioners.visibility.directoryHelp)).toBeTruthy();
    expect(screen.getByText(en.practitioners.visibility.publicUnavailable)).toBeTruthy();
  });

  it("saves without navigation and shows a localized success toast", async () => {
    saveVisibility.mockResolvedValue({ ok: true, status: "saved" });
    const initialUrl = window.location.href;

    render(
      <ProfileVisibilityForm
        locale="es"
        profile={profile}
        canUsePublic
        dictionary={es.practitioners.visibility}
      />
    );

    expect(screen.getAllByRole("option", { name: "Publico" })).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: es.practitioners.visibility.save }));

    await waitFor(() => {
      expect(saveVisibility).toHaveBeenCalledOnce();
      expect(successToast).toHaveBeenCalledWith(es.practitioners.visibility.saved);
    });
    expect(errorToast).not.toHaveBeenCalled();
    expect(window.location.href).toBe(initialUrl);
  });

  it("shows validation failures only in the toaster", async () => {
    saveVisibility.mockResolvedValue({ ok: false, status: "invalid" });

    render(
      <ProfileVisibilityForm
        locale="en"
        profile={profile}
        canUsePublic
        dictionary={en.practitioners.visibility}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: en.practitioners.visibility.save }));

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith(en.practitioners.visibility.invalid);
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
