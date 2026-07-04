import type { SupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { AuthSettings } from "@/server/models/platform-settings.model";
import type { Database } from "@/types/database";

const allowUnknownMagicLinkLoginKey = "allow_unknown_magic_link_login";

type PlatformSettingRow = Pick<
  Database["public"]["Tables"]["platform_settings"]["Row"],
  "value"
>;
type PlatformSettingUpdate = Database["public"]["Tables"]["platform_settings"]["Update"];
type UserLoginRow = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "is_deleted">;
type QueryError = { message: string } | null;

type PlatformSettingsClient = {
  from(table: "platform_settings"): {
    select(columns: "value"): {
      eq(column: "key", value: string): {
        maybeSingle(): Promise<{ data: PlatformSettingRow | null; error: QueryError }>;
      };
    };
    update(values: PlatformSettingUpdate): {
      eq(column: "key", value: string): Promise<{ error: QueryError }>;
    };
  };
};

type UserLookupClient = {
  from(table: "users"): {
    select(columns: "id, is_deleted"): {
      eq(column: "email", value: string): {
        maybeSingle(): Promise<{ data: UserLoginRow | null; error: QueryError }>;
      };
    };
  };
};

function readBooleanSetting(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export async function getAuthSettings(
  supabase: SupabaseAdminClient | SupabaseServerClient,
  fallback: AuthSettings = { allowUnknownMagicLinkLogin: true }
): Promise<AuthSettings> {
  const queryClient = supabase as unknown as PlatformSettingsClient;
  const { data, error } = await queryClient
    .from("platform_settings")
    .select("value")
    .eq("key", allowUnknownMagicLinkLoginKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    allowUnknownMagicLinkLogin: readBooleanSetting(
      data?.value,
      fallback.allowUnknownMagicLinkLogin
    ),
  };
}

export async function updateAuthSettings(
  supabase: SupabaseServerClient,
  actorUserId: string,
  settings: AuthSettings
) {
  const queryClient = supabase as unknown as PlatformSettingsClient;
  const { error } = await queryClient
    .from("platform_settings")
    .update({
      value: settings.allowUnknownMagicLinkLogin,
      updated_by: actorUserId,
    })
    .eq("key", allowUnknownMagicLinkLoginKey);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getUserLoginRecordByEmail(
  supabase: SupabaseAdminClient,
  email: string
) {
  const queryClient = supabase as unknown as UserLookupClient;
  const { data, error } = await queryClient
    .from("users")
    .select("id, is_deleted")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data
    ? {
        id: data.id,
        isDeleted: data.is_deleted,
      }
    : null;
}
