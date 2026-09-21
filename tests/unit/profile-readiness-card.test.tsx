import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProfileReadinessCard } from "@/features/practitioners/components/profile-readiness-card";
import en from "@/messages/en.json";
import type { PractitionerProfile } from "@/server/models/practitioner.model";

const completeProfile: PractitionerProfile = {
  id: "profile-1",
  userId: "user-1",
  publicGroup: "apprentice",
  displayName: "Trainee One",
  bio: "A complete biography",
  country: "Spain",
  city: "Madrid",
  latitude: 40.4168,
  longitude: -3.7038,
  practiceLocations: [],
  languages: ["English"],
  website: "https://example.com",
  instagramUrl: null,
  facebookUrl: null,
  youtubeUrl: null,
  tiktokUrl: null,
  profileImageUrl: "/api/media/r2/avatars/user-1/profile.jpg",
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
  whatsapp: {
    number: null,
    visibility: "private",
    grantedAt: null,
    policyVersion: null,
  },
  createdAt: "2026-09-21T00:00:00Z",
  updatedAt: "2026-09-21T00:00:00Z",
};

describe("ProfileReadinessCard", () => {
  afterEach(cleanup);

  it("shows profile readiness on the profile page while fewer than 9 fields are complete", () => {
    render(
      <ProfileReadinessCard
        profile={{ ...completeProfile, website: null }}
        dictionary={en.dashboard.apprenticeData}
      />
    );

    expect(screen.getByText("Profile readiness")).toBeTruthy();
    expect(screen.getByText("8/9 profile fields completed")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("89");
  });

  it("does not render once all 9 profile fields are complete", () => {
    const { container } = render(
      <ProfileReadinessCard
        profile={completeProfile}
        dictionary={en.dashboard.apprenticeData}
      />
    );

    expect(container.innerHTML).toBe("");
  });
});
