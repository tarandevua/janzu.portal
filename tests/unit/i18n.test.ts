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
    expect(en.dashboard.sidebar.roles.instructor).toBe("Instructor");
    expect(en.dashboard.sidebar.roles.apprentice).toBe("Trainee");
    expect(en.dashboard.sidebar.clients).toBe("Session Participants");

    expect(es.dashboard.sidebar.roles.instructor).toBe("Instructor");
    expect(es.dashboard.sidebar.roles.apprentice).toBe("Persona en formación");
    expect(es.dashboard.sidebar.clients).toBe("Participantes de sesiones");
  });

  it("describes the active feedback workflow without sprint placeholders", () => {
    expect(en.sessions.listDescription).not.toMatch(/next sprint/i);
    expect(es.sessions.listDescription).not.toMatch(/proximo sprint/i);
    expect(en.notifications.participant).toBe("Session participant");
    expect(es.notifications.participant).toBe("Participante de sesión");
  });

  it("links contextual calendar guidance in both supported languages", () => {
    expect(en.sessions.calendarGuidanceTitle).toBeTruthy();
    expect(en.sessions.calendarGuidanceDescription).toMatch(/visitors|booking states|times/i);
    expect(en.sessions.calendarGuidanceLink).toMatch(/calendar guide/i);

    expect(es.sessions.calendarGuidanceTitle).toBeTruthy();
    expect(es.sessions.calendarGuidanceDescription).toMatch(/visitantes|estados de reserva|horarios/i);
    expect(es.sessions.calendarGuidanceLink).toMatch(/guia del calendario/i);
  });

  it("localizes the complete structured training-history read model", () => {
    for (const dictionary of [en.training, es.training]) {
      expect(dictionary.currentLevel).toBeTruthy();
      expect(dictionary.recordDetails).toBeTruthy();
      expect(dictionary.verifier).toBeTruthy();
      expect(dictionary.verifiedAt).toBeTruthy();
      expect(dictionary.error).toBeTruthy();
      expect(dictionary.reviewingTitle).toBeTruthy();
      expect(dictionary.activeInstructor).toBeTruthy();
      expect(dictionary.noActiveInstructor).toBeTruthy();
      expect(dictionary.backToSupervision).toBeTruthy();
    }
  });
});
