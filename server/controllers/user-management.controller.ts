import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assignManagedUserRole,
  inviteManagedUser,
  listUsersForManagement,
  removeManagedUserRole,
} from "@/server/services/user-management.service";
import {
  userInviteSchema,
  userRoleMutationSchema,
} from "@/server/validators/user-management.schema";

async function getUserContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function listManagedPortalUsers() {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const users = await listUsersForManagement(supabase, user.id);

  return NextResponse.json({ data: users, error: null });
}

export async function assignManagedPortalUserRole(request: NextRequest) {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const parsed = userRoleMutationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Role assignment payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  await assignManagedUserRole(supabase, user.id, parsed.data.userId, parsed.data.role);

  return NextResponse.json({ data: { ok: true }, error: null });
}

export async function removeManagedPortalUserRole(request: NextRequest) {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const parsed = userRoleMutationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Role removal payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  await removeManagedUserRole(supabase, user.id, parsed.data.userId, parsed.data.role);

  return NextResponse.json({ data: { ok: true }, error: null });
}

export async function inviteManagedPortalUser(request: NextRequest) {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const parsed = userInviteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "User invite payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  await inviteManagedUser(supabase, user.id, {
    ...parsed.data,
    locale: "en",
    roleLabel: parsed.data.role,
  });

  return NextResponse.json({ data: { ok: true }, error: null }, { status: 201 });
}
