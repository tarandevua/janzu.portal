import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProfileMapPreview } from "@/features/practitioners/components/profile-map-preview";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

describe("ProfileMapPreview", () => {
  afterEach(cleanup);

  it.each([
    ["en", en.practitioners.mapPreview],
    ["es", es.practitioners.mapPreview],
  ] as const)("renders localized public and community empty previews in %s", (locale, dictionary) => {
    render(
      <ProfileMapPreview
        locale={locale}
        publicPoints={[]}
        communityPoints={[]}
        dictionary={dictionary}
      />
    );

    expect(screen.getByRole("heading", { name: dictionary.title })).toBeTruthy();
    expect(screen.getByText(dictionary.publicEmpty)).toBeTruthy();
    expect(screen.getByText(dictionary.communityEmpty)).toBeTruthy();
  });
});
