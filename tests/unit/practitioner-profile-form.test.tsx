import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PractitionerProfileForm } from "@/features/practitioners/components/practitioner-profile-form";
import en from "@/messages/en.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/practitioners/actions", () => ({
  savePractitionerProfileInline: vi.fn(),
}));

vi.mock("@/components/rich-text-editor", () => ({
  RichTextEditor: () => null,
}));

vi.mock("@/features/maps/components/multi-coordinate-picker", () => ({
  MultiCoordinatePicker: () => null,
}));

describe("PractitionerProfileForm", () => {
  afterEach(cleanup);

  it("opens the avatar file picker when the avatar placeholder is clicked", () => {
    render(
      <PractitionerProfileForm
        locale="en"
        profile={null}
        fullName="Nomad Mao"
        officialFullName=""
        dictionary={en.practitioners.form}
      />
    );

    const fileInput = document.querySelector<HTMLInputElement>("#avatarImage");
    expect(fileInput).not.toBeNull();

    const clickFileInput = vi.spyOn(fileInput!, "click");
    fireEvent.click(
      screen.getByRole("button", { name: en.practitioners.form.profileImageUpload })
    );

    expect(clickFileInput).toHaveBeenCalledOnce();
  });
});
