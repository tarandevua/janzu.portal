import { NextResponse, type NextRequest } from "next/server";
import { getEmailOperationsEnv } from "@/lib/env";
import {
  recordProviderWebhook,
  secureSecretMatches,
} from "@/server/services/transactional-email.service";
import { brevoWebhookSchema } from "@/server/validators/transactional-email.schema";

export async function POST(request: NextRequest) {
  let secret: string;
  try {
    secret = getEmailOperationsEnv().BREVO_WEBHOOK_SECRET;
  } catch {
    return NextResponse.json({ error: "Email webhook is not configured." }, { status: 503 });
  }
  const authorization = request.headers.get("authorization");
  const provided = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!secureSecretMatches(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = brevoWebhookSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 422 });
  }
  if (parsed.data.event !== "request") {
    await recordProviderWebhook({
      providerMessageId: parsed.data["message-id"],
      event: parsed.data.event,
      failureCode: `brevo_${parsed.data.event}`,
    });
  }
  return NextResponse.json({ received: true });
}
