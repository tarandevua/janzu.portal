import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getPrimaryRole, getRoleAccessList } from "@/server/services/rbac.service";

export async function getCurrentUserRoles() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "UNAUTHENTICATED",
          message: "Sign in is required."
        }
      },
      { status: 401 }
    );
  }

  const roles = await listUserRoles(supabase, user.id);

  return NextResponse.json({
    data: {
      userId: user.id,
      roles,
      primaryRole: getPrimaryRole(roles),
      access: getRoleAccessList(roles)
    },
    error: null
  });
}
