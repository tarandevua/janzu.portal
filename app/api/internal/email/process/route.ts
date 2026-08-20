import { NextResponse, type NextRequest } from "next/server";
import { getEmailOperationsEnv } from "@/lib/env";
import {
  processTransactionalEmailBatch,
  secureSecretMatches,
} from "@/server/services/transactional-email.service";

export async function POST(request: NextRequest) {
  let secret: string;
  try {
    secret = getEmailOperationsEnv().EMAIL_WORKER_SECRET;
  } catch {
    return NextResponse.json({ error: "Email worker is not configured." }, { status: 503 });
  }
  const authorization = request.headers.get("authorization");
  const provided = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!secureSecretMatches(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const processed = await processTransactionalEmailBatch();
  return NextResponse.json({ processed });
}
