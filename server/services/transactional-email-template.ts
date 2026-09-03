import type { Locale } from "@/lib/i18n/config";
import type {
  SafeEmailMetadata,
  TransactionalEmailEventType,
} from "@/server/models/transactional-email.model";

type TemplateInput = {
  eventType: TransactionalEmailEventType;
  locale: Locale;
  displayName: string;
  destinationUrl: string;
  metadata: SafeEmailMetadata;
};

export type TransactionalEmailTemplate = {
  subject: string;
  htmlContent: string;
  textContent: string;
};

const familyCopy = {
  session: {
    en: ["Session update", "There is an update to a session in your portal."],
    es: ["Actualización de sesión", "Hay una actualización de una sesión en tu portal."],
  },
  booking: {
    en: ["Booking request", "There is a new booking request in your portal."],
    es: ["Solicitud de reserva", "Hay una nueva solicitud de reserva en tu portal."],
  },
  feedback: {
    en: ["Feedback received", "Feedback was received for one of your sessions."],
    es: ["Feedback recibido", "Se recibió feedback para una de tus sesiones."],
  },
  instructor_assignment: {
    en: ["Instructor assignment update", "There is an update to an Instructor assignment."],
    es: ["Actualización de asignación de Instructor", "Hay una actualización de una asignación de Instructor."],
  },
  certification: {
    en: ["Certification update", "There is an update to a certification journey."],
    es: ["Actualización de certificación", "Hay una actualización de un recorrido de certificación."],
  },
  assessment: {
    en: ["Assessment update", "There is an update to an assessment in your portal."],
    es: ["Actualización de evaluación", "Hay una actualización de una evaluación en tu portal."],
  },
  certificate: {
    en: ["Certificate update", "There is an update to your certificate."],
    es: ["Actualización de certificado", "Hay una actualización de tu certificado."],
  },
  role: {
    en: ["Portal role update", "There is an update to your portal access."],
    es: ["Actualización de rol del portal", "Hay una actualización de tu acceso al portal."],
  },
} as const satisfies Record<string, Record<Locale, readonly [string, string]>>;

const eventStateCopy = {
  "session.registered": { en: "Registered", es: "Registrada" },
  "booking.requested": { en: "Requested", es: "Solicitada" },
  "feedback.received": { en: "Received", es: "Recibido" },
  "session.validated": { en: "Validated", es: "Validada" },
  "session.validation_removed": { en: "Validation removed", es: "Validación eliminada" },
  "instructor_assignment.requested": { en: "Requested", es: "Solicitada" },
  "instructor_assignment.accepted": { en: "Accepted", es: "Aceptada" },
  "instructor_assignment.declined": { en: "Declined", es: "Rechazada" },
  "instructor_assignment.cancelled": { en: "Cancelled", es: "Cancelada" },
  "instructor_assignment.ended": { en: "Ended", es: "Finalizada" },
  "instructor_assignment.transferred": { en: "Transferred", es: "Transferida" },
  "certification.milestone_25_reached": { en: "25-session milestone reached", es: "Hito de 25 sesiones alcanzado" },
  "certification.level_2_readiness_approved": { en: "Level 2 readiness approved", es: "Preparación para Nivel 2 aprobada" },
  "certification.level_2_readiness_rejected": { en: "Level 2 readiness rejected", es: "Preparación para Nivel 2 rechazada" },
  "certification.level_2_readiness_revision_required": { en: "Level 2 revision required", es: "Revisión de Nivel 2 requerida" },
  "certification.level_2_readiness_overridden": { en: "Level 2 decision overridden", es: "Decisión de Nivel 2 sustituida" },
  "certification.milestone_50_reached": { en: "50-session milestone reached", es: "Hito de 50 sesiones alcanzado" },
  "assessment.readiness_requested": { en: "Readiness requested", es: "Preparación solicitada" },
  "assessment.readiness_approved": { en: "Readiness approved", es: "Preparación aprobada" },
  "assessment.readiness_rejected": { en: "Readiness rejected", es: "Preparación rechazada" },
  "assessment.assessor_assigned": { en: "Assessor assigned", es: "Persona evaluadora asignada" },
  "assessment.scheduled": { en: "Scheduled", es: "Programada" },
  "assessment.revision_required": { en: "Revision required", es: "Revisión requerida" },
  "assessment.passed": { en: "Passed", es: "Aprobada" },
  "assessment.failed": { en: "Not passed", es: "No aprobada" },
  "assessment.remediation_verified": { en: "Remediation verified", es: "Remediación verificada" },
  "certification.approved": { en: "Approved", es: "Aprobada" },
  "certification.suspended": { en: "Suspended", es: "Suspendida" },
  "certification.revoked": { en: "Revoked", es: "Revocada" },
  "certification.reinstated": { en: "Reinstated", es: "Restablecida" },
  "certification.overridden": { en: "Decision overridden", es: "Decisión sustituida" },
  "certificate.issued": { en: "Issued", es: "Emitido" },
  "certificate.replaced": { en: "Replaced", es: "Reemplazado" },
  "certificate.revoked": { en: "Revoked", es: "Revocado" },
  "role.assigned": { en: "Assigned", es: "Asignado" },
  "role.removed": { en: "Removed", es: "Eliminado" },
} as const satisfies Record<TransactionalEmailEventType, Record<Locale, string>>;

const forbiddenMetadataKey = /(feedback.*text|experience|notes?|evidence|reason|message|contact|email|token|signature)/i;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getFamily(eventType: TransactionalEmailEventType) {
  return eventType.split(".")[0] as keyof typeof familyCopy;
}

export function assertSafeEmailMetadata(metadata: SafeEmailMetadata) {
  const serialized = JSON.stringify(metadata);

  if (serialized.length > 16_000) {
    throw new Error("Email event metadata exceeds the safe size limit.");
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (forbiddenMetadataKey.test(key)) {
      throw new Error(`Sensitive metadata key is not allowed: ${key}`);
    }
    if (value !== null && !["string", "number", "boolean"].includes(typeof value)) {
      throw new Error(`Email event metadata must contain only safe scalar values: ${key}`);
    }
  }
}

function hasOnlyExactRecord(params: URLSearchParams, key: string) {
  return params.size === 1 && uuidPattern.test(params.get(key) ?? "");
}

export function assertAuthorizedEmailDestination(
  eventType: TransactionalEmailEventType,
  locale: Locale,
  destinationPath: string
) {
  const url = new URL(destinationPath, "https://portal.invalid");

  if (url.origin !== "https://portal.invalid" || !url.pathname.startsWith(`/${locale}/dashboard`)) {
    throw new Error("Email destinations must be localized portal paths.");
  }

  const family = getFamily(eventType);
  let valid = false;

  if (family === "session") {
    valid = url.pathname === `/${locale}/dashboard/sessions` && hasOnlyExactRecord(url.searchParams, "sessionId");
  } else if (family === "booking") {
    valid =
      url.pathname === `/${locale}/dashboard/sessions` &&
      url.searchParams.size === 2 &&
      url.searchParams.get("tab") === "requests" &&
      uuidPattern.test(url.searchParams.get("requestId") ?? "");
  } else if (family === "feedback") {
    valid = url.pathname === `/${locale}/dashboard/feedback` && hasOnlyExactRecord(url.searchParams, "feedbackId");
  } else if (family === "instructor_assignment") {
    valid = url.pathname === `/${locale}/dashboard/supervision` && hasOnlyExactRecord(url.searchParams, "assignmentId");
  } else if (family === "assessment") {
    valid = url.pathname === `/${locale}/dashboard/certification` && hasOnlyExactRecord(url.searchParams, "assessmentId");
  } else if (family === "certificate") {
    valid = url.pathname === `/${locale}/dashboard/certification` && hasOnlyExactRecord(url.searchParams, "certificateId");
  } else if (family === "role") {
    valid = url.pathname === `/${locale}/dashboard` && url.searchParams.size === 0;
  } else if (family === "certification") {
    const allowedKey = eventType.includes("milestone") ? ["journeyId", "traineeId"] : ["decisionId"];
    valid =
      url.pathname === `/${locale}/dashboard/certification` &&
      allowedKey.some((key) => hasOnlyExactRecord(url.searchParams, key));
  }

  if (!valid) {
    throw new Error(`Destination does not identify the authorized ${eventType} portal record.`);
  }
}

export function buildTransactionalEmailTemplate({
  eventType,
  locale,
  displayName,
  destinationUrl,
  metadata,
}: TemplateInput): TransactionalEmailTemplate {
  assertSafeEmailMetadata(metadata);
  const [familySubject, body] = familyCopy[getFamily(eventType)][locale];
  const state = eventStateCopy[eventType][locale];
  const subject = `${familySubject}: ${state}`;
  const greeting = locale === "es" ? `Hola ${displayName},` : `Hello ${displayName},`;
  const action = locale === "es" ? "Ver el registro en el portal" : "View the portal record";
  const privacy = locale === "es"
    ? "Los detalles privados permanecen en el portal autenticado."
    : "Private details remain in the authenticated portal.";
  const certificateNumber = typeof metadata.certificateNumber === "string"
    && /^JZ-[0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(metadata.certificateNumber)
    ? metadata.certificateNumber
    : null;
  const certificateVerification = getFamily(eventType) === "certificate" && certificateNumber
    ? {
        label: locale === "es" ? "Verificación pública" : "Public verification",
        url: new URL(`/${locale}/certificates/verify/${certificateNumber}`, destinationUrl).toString(),
      }
    : null;

  return {
    subject,
    htmlContent: [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>${escapeHtml(body)} <strong>${escapeHtml(state)}</strong></p>`,
      `<p><a href="${escapeHtml(destinationUrl)}">${escapeHtml(action)}</a></p>`,
      certificateVerification
        ? `<p>${escapeHtml(certificateVerification.label)}: <a href="${escapeHtml(certificateVerification.url)}">${escapeHtml(certificateNumber ?? "")}</a></p>`
        : "",
      `<p>${escapeHtml(privacy)}</p>`,
    ].filter(Boolean).join("\n"),
    textContent: [
      greeting,
      `${body} ${state}`,
      `${action}: ${destinationUrl}`,
      certificateVerification ? `${certificateVerification.label}: ${certificateNumber} (${certificateVerification.url})` : null,
      privacy,
    ].filter((value): value is string => Boolean(value)).join("\n\n"),
  };
}
