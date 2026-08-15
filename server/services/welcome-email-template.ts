import type { Locale } from "@/lib/i18n/config";
import type { Role } from "@/server/models/rbac.model";
import { normalizeRoles } from "@/server/services/rbac.service";

type WelcomeEmailTemplateInput = {
  locale: Locale;
  displayName: string;
  roles: Role[];
  siteUrl: string;
};

export type WelcomeEmailTemplate = {
  subject: string;
  htmlContent: string;
  textContent: string;
};

const roleLabels: Record<Locale, Record<Role, string>> = {
  en: {
    admin: "Administrator",
    instructor: "Instructor",
    facilitator: "Facilitator",
    practitioner: "Practitioner",
    apprentice: "Trainee",
  },
  es: {
    admin: "Administrador",
    instructor: "Instructor",
    facilitator: "Facilitador",
    practitioner: "Practicante",
    apprentice: "Persona en formación",
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function joinRoleLabels(locale: Locale, roles: Role[]) {
  const labels = normalizeRoles(roles).map((role) => roleLabels[locale][role]);

  if (labels.length === 0) {
    return locale === "es" ? "Miembro del portal" : "Portal member";
  }

  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(labels);
}

function localizedUrl(siteUrl: string, locale: Locale, path: string) {
  const baseUrl = siteUrl.replace(/\/$/, "");
  return `${baseUrl}/${locale}${path}`;
}

export function buildWelcomeEmailTemplate({
  locale,
  displayName,
  roles,
  siteUrl,
}: WelcomeEmailTemplateInput): WelcomeEmailTemplate {
  const roleList = joinRoleLabels(locale, roles);
  const firstStepsGuideUrl = localizedUrl(
    siteUrl,
    locale,
    "/dashboard/knowledge-base/getting-started/first-steps"
  );
  const firstStepsChecklistUrl = localizedUrl(siteUrl, locale, "/dashboard/first-steps");
  const certificationUrl = localizedUrl(
    siteUrl,
    locale,
    "/dashboard/knowledge-base/certification/overview"
  );
  const privacyUrl = localizedUrl(siteUrl, locale, "/dashboard/profile#visibility");
  const supportUrl = localizedUrl(
    siteUrl,
    locale,
    "/dashboard/knowledge-base/getting-started/welcome"
  );
  const isTrainee = roles.includes("apprentice");
  const safeName = escapeHtml(displayName);
  const safeRoles = escapeHtml(roleList);

  if (locale === "es") {
    const checklistHtml = isTrainee
      ? `<p><a href="${firstStepsChecklistUrl}">Abrir tu lista personal de Primeros pasos</a></p>`
      : "";
    const checklistText = isTrainee
      ? `\nTu lista personal de Primeros pasos: ${firstStepsChecklistUrl}`
      : "";

    return {
      subject: "Te damos la bienvenida al Portal de la Comunidad Janzu",
      htmlContent: [
        `<p>Hola ${safeName},</p>`,
        "<p>Tu cuenta del Portal de la Comunidad Janzu está activa.</p>",
        `<p><strong>Tu rol:</strong> ${safeRoles}</p>`,
        `<p>Empieza con la guía de <a href="${firstStepsGuideUrl}">Primeros pasos</a>. Te orienta sobre el Acuerdo de Aprendizaje, el perfil, el historial de formación, la relación con tu Instructor, el calendario, las sesiones y el feedback.</p>`,
        checklistHtml,
        `<p><strong>Certificación:</strong> el recorrido aprobado avanza por Nivel 1, 25 sesiones válidas, Nivel 2, 50 sesiones válidas, evaluación y Practicante. Alcanzar un total no aprueba automáticamente el siguiente paso. <a href="${certificationUrl}">Revisar el resumen de certificación</a>.</p>`,
        `<p><strong>Privacidad:</strong> los campos opcionales empiezan como privados. Tú eliges la audiencia permitida para cada campo; los registros de sesiones, participantes y feedback siguen limitados a personas autorizadas. <a href="${privacyUrl}">Revisar la visibilidad del perfil</a>.</p>`,
        `<p>¿Necesitas ayuda? Consulta la <a href="${supportUrl}">guía de bienvenida y soporte</a> o contacta a una persona administradora del portal.</p>`,
      ].join("\n"),
      textContent: [
        `Hola ${displayName},`,
        "Tu cuenta del Portal de la Comunidad Janzu está activa.",
        `Tu rol: ${roleList}`,
        `Primeros pasos: ${firstStepsGuideUrl}${checklistText}`,
        `Certificación: Nivel 1, 25 sesiones válidas, Nivel 2, 50 sesiones válidas, evaluación y Practicante. Alcanzar un total no aprueba automáticamente el siguiente paso. ${certificationUrl}`,
        `Privacidad: los campos opcionales empiezan como privados y los registros de sesiones, participantes y feedback siguen limitados a personas autorizadas. ${privacyUrl}`,
        `Ayuda y soporte: ${supportUrl}. También puedes contactar a una persona administradora del portal.`,
      ].join("\n\n"),
    };
  }

  const checklistHtml = isTrainee
    ? `<p><a href="${firstStepsChecklistUrl}">Open your personal First Steps checklist</a></p>`
    : "";
  const checklistText = isTrainee
    ? `\nYour personal First Steps checklist: ${firstStepsChecklistUrl}`
    : "";

  return {
    subject: "Welcome to the Janzu Community Portal",
    htmlContent: [
      `<p>Hello ${safeName},</p>`,
      "<p>Your Janzu Community Portal account is active.</p>",
      `<p><strong>Your role:</strong> ${safeRoles}</p>`,
      `<p>Begin with the <a href="${firstStepsGuideUrl}">First Steps guide</a>. It covers the Learning Alliance, profile setup, training history, your Instructor relationship, calendar, sessions, and feedback.</p>`,
      checklistHtml,
      `<p><strong>Certification:</strong> the approved journey moves through Level 1, 25 counted sessions, Level 2, 50 counted sessions, assessment, and Practitioner. Reaching a total does not automatically approve the next step. <a href="${certificationUrl}">Review the certification overview</a>.</p>`,
      `<p><strong>Privacy:</strong> optional fields start private. You choose the permitted audience for each field; session, participant, and feedback records remain limited to authorized people. <a href="${privacyUrl}">Review profile visibility</a>.</p>`,
      `<p>Need help? Read the <a href="${supportUrl}">welcome and support guide</a> or contact a portal Administrator.</p>`,
    ].join("\n"),
    textContent: [
      `Hello ${displayName},`,
      "Your Janzu Community Portal account is active.",
      `Your role: ${roleList}`,
      `First Steps: ${firstStepsGuideUrl}${checklistText}`,
      `Certification: Level 1, 25 counted sessions, Level 2, 50 counted sessions, assessment, and Practitioner. Reaching a total does not automatically approve the next step. ${certificationUrl}`,
      `Privacy: optional fields start private, and session, participant, and feedback records remain limited to authorized people. ${privacyUrl}`,
      `Help and support: ${supportUrl}. You can also contact a portal Administrator.`,
    ].join("\n\n"),
  };
}
