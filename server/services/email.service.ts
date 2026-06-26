import "server-only";

import { getServerEnv } from "@/lib/env";

type SendInviteEmailInput = {
  toEmail: string;
  toName?: string | null;
  inviteUrl: string;
  roleLabel: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendInviteEmail({
  toEmail,
  toName,
  inviteUrl,
  roleLabel,
}: SendInviteEmailInput) {
  const env = getServerEnv();
  const displayName = toName || toEmail;
  const escapedName = escapeHtml(displayName);
  const escapedRole = escapeHtml(roleLabel);
  const escapedInviteUrl = escapeHtml(inviteUrl);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
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
          email: toEmail,
          name: displayName,
        },
      ],
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
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo invite email failed: ${body}`);
  }
}
