import { describe, expect, it } from "vitest";
import { toPractitionerMapMarkers } from "@/features/practitioners/utils/map-points";

describe("practitioner map points", () => {
  it("maps the safe projection without inventing private fields", () => {
    const [marker] = toPractitionerMapMarkers(
      [
        {
          markerId: "marker-302",
          profileId: "profile-302",
          publicGroup: "instructor",
          displayName: "Janzu member",
          city: "Barcelona",
          country: "Spain",
          latitude: 41.4,
          longitude: 2.2,
          profileImageUrl: null,
          whatsappNumber: null,
        },
      ],
      { locale: "es", detailsLabel: "Ver detalles", includeDetailsLink: true }
    );

    expect(marker).toMatchObject({
      id: "marker-302",
      practitionerGroup: "instructor",
      title: "Janzu member",
      meta: "Barcelona, Spain",
      latitude: 41.4,
      longitude: 2.2,
      href: "/es/practitioners/profile-302",
      hrefLabel: "Ver detalles",
    });
    expect(marker.note).toBeUndefined();
  });

  it("adds an explicitly projected community WhatsApp number to the popup", () => {
    const [marker] = toPractitionerMapMarkers(
      [{
        markerId: "marker-303", profileId: "profile-303", publicGroup: "facilitator",
        displayName: "Member 303", city: "Chisinau", country: "Moldova",
        latitude: 47, longitude: 28.9, profileImageUrl: null,
        whatsappNumber: "+37360123456",
      }],
      { locale: "en", detailsLabel: "", includeDetailsLink: false, whatsappLabel: "WhatsApp" }
    );

    expect(marker.description).toBe("WhatsApp: +37360123456");
    expect(marker.href).toBeUndefined();
  });
});
