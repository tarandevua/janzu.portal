import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  listLocationReviewQueue,
  listMyLocations,
  listPublicLocations,
  reviewLocation,
  submitMyLocation,
} from "@/server/services/location.service";
import { hasPermission } from "@/server/services/rbac.service";
import { locationReviewSchema, locationSchema } from "@/server/validators/location.schema";

async function getUserContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function listApprovedPublicLocations() {
  const supabase = await createSupabaseServerClient();
  const locations = await listPublicLocations(supabase);

  return NextResponse.json({ data: locations, error: null });
}

export async function listCurrentUserLocations() {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const locations = await listMyLocations(supabase, user.id);

  return NextResponse.json({ data: locations, error: null });
}

export async function createCurrentUserLocation(request: NextRequest) {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const parsed = locationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Location payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const location = await submitMyLocation(supabase, user.id, parsed.data);

  return NextResponse.json({ data: location, error: null }, { status: 201 });
}

export async function listReviewerLocations() {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const roles = await listUserRoles(supabase, user.id);

  if (!hasPermission(roles, "locations:approve")) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Location reviewer access is required." } },
      { status: 403 }
    );
  }

  const locations = await listLocationReviewQueue(supabase);

  return NextResponse.json({ data: locations, error: null });
}

export async function reviewSubmittedLocation(request: NextRequest) {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const parsed = locationReviewSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Location review payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const roles = await listUserRoles(supabase, user.id);

  if (!hasPermission(roles, "locations:approve")) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Location reviewer access is required." } },
      { status: 403 }
    );
  }

  const location = await reviewLocation(
    supabase,
    parsed.data.locationId,
    user.id,
    parsed.data.action
  );

  return NextResponse.json({ data: location, error: null });
}
