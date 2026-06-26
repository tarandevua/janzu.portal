import { describe, expect, it } from "vitest";
import {
  createMarkerPopupHtml,
  formatCoordinate,
  getMapCenter,
  hasValidCoordinates,
} from "@/features/maps/utils";

describe("map utilities", () => {
  it("validates coordinate ranges", () => {
    expect(hasValidCoordinates({ latitude: 47, longitude: 28 })).toBe(true);
    expect(hasValidCoordinates({ latitude: null, longitude: 28 })).toBe(false);
    expect(hasValidCoordinates({ latitude: 91, longitude: 28 })).toBe(false);
  });

  it("centers around marker averages", () => {
    const center = getMapCenter([
      {
        id: "one",
        kind: "location",
        title: "One",
        latitude: 10,
        longitude: 20,
      },
      {
        id: "two",
        kind: "location",
        title: "Two",
        latitude: 30,
        longitude: 40,
      },
    ]);

    expect(center).toEqual({ latitude: 20, longitude: 30, zoom: 3 });
  });

  it("escapes popup content", () => {
    const html = createMarkerPopupHtml({
      id: "unsafe",
      kind: "practitioner",
      title: "<script>alert(1)</script>",
      latitude: 0,
      longitude: 0,
    });

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("formats coordinates with seven decimal places", () => {
    expect(formatCoordinate(47.0016695)).toBe("47.0016695");
    expect(formatCoordinate(28.8229)).toBe("28.8229000");
  });
});
