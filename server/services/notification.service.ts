import type { SupabaseServerClient } from "@/lib/supabase/server";
import {
  countUnreadNotificationsForUser,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from "@/server/repositories/notification.repository";

export function listMyNotifications(
  supabase: SupabaseServerClient,
  userId: string,
  page?: number,
  pageSize?: number
) {
  return listNotificationsForUser(supabase, userId, page, pageSize);
}

export function countMyUnreadNotifications(supabase: SupabaseServerClient, userId: string) {
  return countUnreadNotificationsForUser(supabase, userId);
}

export function markMyNotificationRead(
  supabase: SupabaseServerClient,
  notificationId: string,
  userId: string
) {
  return markNotificationReadForUser(supabase, notificationId, userId);
}

export function markAllMyNotificationsRead(supabase: SupabaseServerClient, userId: string) {
  return markAllNotificationsReadForUser(supabase, userId);
}
