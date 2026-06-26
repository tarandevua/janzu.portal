import type { SupabaseServerClient } from "@/lib/supabase/server";
import {
  listNotificationsForUser,
  markNotificationReadForUser,
} from "@/server/repositories/notification.repository";

export function listMyNotifications(supabase: SupabaseServerClient, userId: string) {
  return listNotificationsForUser(supabase, userId);
}

export function markMyNotificationRead(
  supabase: SupabaseServerClient,
  notificationId: string,
  userId: string
) {
  return markNotificationReadForUser(supabase, notificationId, userId);
}
