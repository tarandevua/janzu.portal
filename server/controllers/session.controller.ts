import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMySession, listMySessions } from "@/server/services/session.service";
import { sessionSchema } from "@/server/validators/session.schema";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function listCurrentUserSessions() {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const sessions = await listMySessions(supabase, user.id);

  return NextResponse.json({ data: sessions, error: null });
}

export async function createCurrentUserSession(request: NextRequest) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const parsed = sessionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Session payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const session = await createMySession(supabase, user.id, parsed.data);

  return NextResponse.json({ data: session, error: null }, { status: 201 });
}
