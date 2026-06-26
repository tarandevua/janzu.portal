import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  createManagedEvent,
  listEventsForManagement,
  listPublicEvents,
  rsvpCurrentUserToEvent,
} from "@/server/services/event.service";
import { hasPermission } from "@/server/services/rbac.service";
import { eventRsvpSchema, eventSchema } from "@/server/validators/event.schema";

async function getUserContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function listPublishedPublicEvents() {
  const supabase = await createSupabaseServerClient();
  const events = await listPublicEvents(supabase);

  return NextResponse.json({ data: events, error: null });
}

export async function listManagedCommunityEvents() {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const roles = await listUserRoles(supabase, user.id);

  if (!hasPermission(roles, "events:manage")) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Event manager access is required." } },
      { status: 403 }
    );
  }

  const events = await listEventsForManagement(supabase, roles);

  return NextResponse.json({ data: events, error: null });
}

export async function createCommunityEvent(request: NextRequest) {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const parsed = eventSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Event payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const roles = await listUserRoles(supabase, user.id);

  if (!hasPermission(roles, "events:manage")) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Event manager access is required." } },
      { status: 403 }
    );
  }

  const event = await createManagedEvent(supabase, user.id, roles, parsed.data);

  return NextResponse.json({ data: event, error: null }, { status: 201 });
}

export async function rsvpToCommunityEvent(request: NextRequest) {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const parsed = eventRsvpSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Event RSVP payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const rsvp = await rsvpCurrentUserToEvent(supabase, parsed.data.eventId, user.id);

  return NextResponse.json({ data: rsvp, error: null }, { status: 201 });
}
