import "server-only";

import { getEmailEnv } from "@/lib/env";
import type { Locale } from "@/lib/i18n/config";
import type { Role } from "@/server/models/rbac.model";
import { buildWelcomeEmailTemplate } from "@/server/services/welcome-email-template";

type SendInviteEmailInput = {
  toEmail: string;
  toName?: string | null;
  inviteUrl: string;
  roleLabel: string;
};

type SendWelcomeEmailInput = {
  toEmail: string;
  toName?: string | null;
  locale: Locale;
  roles: Role[];
};

type BrevoEmail = {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  deliveryId?: string;
};

export class EmailDeliveryError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean
  ) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendBrevoEmail(email: BrevoEmail) {
  let env: ReturnType<typeof getEmailEnv>;

  try {
    env = getEmailEnv();
  } catch {
    throw new EmailDeliveryError(
      "Transactional email is not configured.",
      "email_configuration_error",
      false
    );
  }

  let response: Response;

  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: env.BREVO_SENDER_EMAIL,
          name: env.BREVO_SENDER_NAME,
        },
        to: [
          {
            email: email.toEmail,
            name: email.toName,
          },
        ],
        subject: email.subject,
        htmlContent: email.htmlContent,
        textContent: email.textContent,
        ...(email.deliveryId
          ? {
              headers: { idempotencyKey: email.deliveryId },
              tags: [`delivery:${email.deliveryId}`],
            }
          : {}),
      }),
    });
  } catch {
    throw new EmailDeliveryError(
      "The email provider could not be reached.",
      "email_provider_unreachable",
      true
    );
  }

  if (!response.ok) {
    const retryable = response.status === 429 || response.status >= 500;
    throw new EmailDeliveryError(
      retryable
        ? "The email provider temporarily rejected the request."
        : "The email provider rejected the request.",
      `email_provider_http_${response.status}`,
      retryable
    );
  }

  const result = (await response.json().catch(() => null)) as {
    messageId?: unknown;
  } | null;
  return typeof result?.messageId === "string" ? result.messageId : null;
}

export function sendTransactionalEmailMessage(input: BrevoEmail & { deliveryId: string }) {
  return sendBrevoEmail(input);
}

export async function sendInviteEmail({
  toEmail,
  toName,
  inviteUrl,
  roleLabel,
}: SendInviteEmailInput) {
  const displayName = toName || toEmail;
  const escapedName = escapeHtml(displayName);
  const escapedRole = escapeHtml(roleLabel);
  const escapedInviteUrl = escapeHtml(inviteUrl);

  await sendBrevoEmail({
    toEmail,
    toName: displayName,
    subject: "You are invited to Janzu Community Portal",
    htmlContent: `
      <p>Hello ${escapedName},</p>
      <p>You have been invited to Janzu Community Portal with the <strong>${escapedRole}</strong> role.</p>
      <p><a href="${escapedInviteUrl}">Accept your invite and sign in</a></p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p>${escapedInviteUrl}</p>
    `,
    textContent: [
      `Hello ${displayName},`,
      `You have been invited to Janzu Community Portal with the ${roleLabel} role.`,
      `Accept your invite and sign in: ${inviteUrl}`,
    ].join("\n\n"),
  });
}

export async function sendWelcomeEmail({
  toEmail,
  toName,
  locale,
  roles,
}: SendWelcomeEmailInput) {
  let siteUrl: string;

  try {
    siteUrl = getEmailEnv().NEXT_PUBLIC_SITE_URL;
  } catch {
    throw new EmailDeliveryError(
      "Transactional email is not configured.",
      "email_configuration_error",
      false
    );
  }

  const displayName = toName || toEmail;
  const template = buildWelcomeEmailTemplate({
    locale,
    displayName,
    roles,
    siteUrl,
  });

  return sendBrevoEmail({
    toEmail,
    toName: displayName,
    ...template,
  });
}
