import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listMyNotifications,
  markMyNotificationRead,
} from "@/server/services/notification.service";
import { markNotificationReadSchema } from "@/server/validators/notification.schema";

async function getUserContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function listCurrentUserNotifications() {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const summary = await listMyNotifications(supabase, user.id);

  return NextResponse.json({ data: summary, error: null });
}

export async function markCurrentUserNotificationRead(request: NextRequest) {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const parsed = markNotificationReadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Notification payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const notification = await markMyNotificationRead(
    supabase,
    parsed.data.notificationId,
    user.id
  );

  return NextResponse.json({ data: notification, error: null });
}
