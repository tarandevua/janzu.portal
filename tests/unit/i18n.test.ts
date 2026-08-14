import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, locales } from "@/lib/i18n/config";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

function dictionaryKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    dictionaryKeys(child, prefix ? `${prefix}.${key}` : key)
  );
}

describe("i18n config", () => {
  it("supports English and Spanish", () => {
    expect(locales).toEqual(["en", "es"]);
  });

  it("uses English as the default locale", () => {
    expect(defaultLocale).toBe("en");
  });

  it("keeps English and Spanish dictionary keys in parity", () => {
    expect(dictionaryKeys(es).sort()).toEqual(dictionaryKeys(en).sort());
  });

  it("validates known locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("maps persisted role and participant keys to the current terminology", () => {
    expect(en.dashboard.sidebar.roles.manager).toBe("Instructor");
    expect(en.dashboard.sidebar.roles.apprentice).toBe("Trainee");
    expect(en.dashboard.sidebar.clients).toBe("Session Participants");

    expect(es.dashboard.sidebar.roles.manager).toBe("Instructor");
    expect(es.dashboard.sidebar.roles.apprentice).toBe("Persona en formación");
    expect(es.dashboard.sidebar.clients).toBe("Participantes de sesiones");
  });

  it("describes the active feedback workflow without sprint placeholders", () => {
    expect(en.sessions.listDescription).not.toMatch(/next sprint/i);
    expect(es.sessions.listDescription).not.toMatch(/proximo sprint/i);
    expect(en.notifications.participant).toBe("Session participant");
    expect(es.notifications.participant).toBe("Participante de sesión");
  });
});
