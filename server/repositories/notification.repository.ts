import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Notification, NotificationSummary } from "@/server/models/notification.model";
import type { Database } from "@/types/database";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listNotificationsForUser(
  supabase: SupabaseServerClient,
  userId: string
): Promise<NotificationSummary> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const notifications = ((data ?? []) as NotificationRow[]).map(toNotification);

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.readAt).length,
  };
}

export async function countUnreadNotificationsForUser(
  supabase: SupabaseServerClient,
  userId: string
) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function markNotificationReadForUser(
  supabase: SupabaseServerClient,
  notificationId: string,
  userId: string
) {
  const payload = {
    read_at: new Date().toISOString(),
  } satisfies NotificationUpdate;

  const { data, error } = await supabase
    .from("notifications")
    .update(payload as never)
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toNotification(data as NotificationRow);
}
