import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createMyClient,
  deleteMyClient,
  listMyClients,
  updateMyClient,
} from "@/server/services/client.service";
import { clientSchema } from "@/server/validators/client.schema";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function listCurrentUserClients() {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const clients = await listMyClients(supabase, user.id);

  return NextResponse.json({ data: clients, error: null });
}

export async function createCurrentUserClient(request: NextRequest) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const parsed = clientSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Session participant payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const client = await createMyClient(supabase, user.id, parsed.data);

  return NextResponse.json({ data: client, error: null }, { status: 201 });
}

export async function updateCurrentUserClient(request: NextRequest, clientId: string) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const parsed = clientSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Session participant payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const client = await updateMyClient(supabase, user.id, clientId, parsed.data);

  return NextResponse.json({ data: client, error: null });
}

export async function deleteCurrentUserClient(clientId: string) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  await deleteMyClient(supabase, user.id, clientId);

  return NextResponse.json({ data: { id: clientId }, error: null });
}
