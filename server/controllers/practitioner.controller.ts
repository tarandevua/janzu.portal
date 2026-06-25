import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  findPublicPractitionerProfiles,
  getMyPractitionerProfile,
  saveMyPractitionerProfile,
} from "@/server/services/practitioner.service";
import { practitionerProfileSchema } from "@/server/validators/practitioner.schema";

export async function getCurrentPractitionerProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const profile = await getMyPractitionerProfile(supabase, user.id);

  return NextResponse.json({ data: profile, error: null });
}

export async function updateCurrentPractitionerProfile(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = practitionerProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Profile payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const profile = await saveMyPractitionerProfile(supabase, user.id, parsed.data);

  return NextResponse.json({ data: profile, error: null });
}

export async function listPublicPractitioners() {
  const supabase = await createSupabaseServerClient();
  const profiles = await findPublicPractitionerProfiles(supabase);

  return NextResponse.json({ data: profiles, error: null });
}
