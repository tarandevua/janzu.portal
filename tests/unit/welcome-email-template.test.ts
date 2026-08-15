import { describe, expect, it } from "vitest";
import { buildWelcomeEmailTemplate } from "@/server/services/welcome-email-template";

describe("TASK-103 welcome email template", () => {
  it("includes the complete English welcome content and Trainee checklist", () => {
    const template = buildWelcomeEmailTemplate({
      locale: "en",
      displayName: "Maya",
      roles: ["apprentice", "facilitator"],
      siteUrl: "https://portal.example.test/",
    });

    expect(template.subject).toBe("Welcome to the Janzu Community Portal");
    expect(template.textContent).toContain("Your role: Facilitator and Trainee");
    expect(template.textContent).toContain(
      "https://portal.example.test/en/dashboard/knowledge-base/getting-started/first-steps"
    );
    expect(template.textContent).toContain(
      "https://portal.example.test/en/dashboard/first-steps"
    );
    expect(template.textContent).toContain("Level 1, 25 counted sessions, Level 2");
    expect(template.textContent).toContain("optional fields start private");
    expect(template.textContent).toContain("Help and support");
  });

  it("localizes all required content and role labels in Spanish", () => {
    const template = buildWelcomeEmailTemplate({
      locale: "es",
      displayName: "María",
      roles: ["instructor"],
      siteUrl: "https://portal.example.test",
    });

    expect(template.subject).toBe("Te damos la bienvenida al Portal de la Comunidad Janzu");
    expect(template.textContent).toContain("Tu rol: Instructor");
    expect(template.textContent).toContain(
      "https://portal.example.test/es/dashboard/knowledge-base/getting-started/first-steps"
    );
    expect(template.textContent).not.toContain("/es/dashboard/first-steps");
    expect(template.textContent).toContain("Nivel 1, 25 sesiones válidas, Nivel 2");
    expect(template.textContent).toContain("los campos opcionales empiezan como privados");
    expect(template.textContent).toContain("Ayuda y soporte");
  });

  it("escapes member-controlled HTML", () => {
    const template = buildWelcomeEmailTemplate({
      locale: "en",
      displayName: '<script>alert("x")</script>',
      roles: ["apprentice"],
      siteUrl: "https://portal.example.test",
    });

    expect(template.htmlContent).not.toContain("<script>");
    expect(template.htmlContent).toContain(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
  });
});
