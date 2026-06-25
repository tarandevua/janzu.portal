import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, locales } from "@/lib/i18n/config";

describe("i18n config", () => {
  it("supports English and Spanish", () => {
    expect(locales).toEqual(["en", "es"]);
  });

  it("uses English as the default locale", () => {
    expect(defaultLocale).toBe("en");
  });

  it("validates known locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
});
