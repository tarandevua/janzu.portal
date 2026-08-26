"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getMyPractitionerProfile,
  saveMyProfileVisibility,
  saveMyPractitionerProfile,
} from "@/server/services/practitioner.service";
import {
  deletePrivateR2Object,
  getManagedAvatarKeyFromUrl,
  isUploadedFile,
  uploadPractitionerAvatar,
} from "@/server/services/r2-storage.service";
import type { Database } from "@/types/database";
import {
  parseLanguages,
  parsePracticeLocations,
  practitionerProfileSchema,
  profileVisibilitySchema,
} from "@/server/validators/practitioner.schema";

type UpdateFullNameArgs =
  Database["public"]["Functions"]["update_current_user_full_name"]["Args"];

type FullNameRpcClient = {
  rpc(
    functionName: "update_current_user_full_name",
    args: UpdateFullNameArgs
  ): Promise<{ error: { message: string } | null }>;
};

export type PractitionerProfileActionResult =
  | {
      ok: true;
      status: "saved";
    }
  | {
      ok: false;
      status:
        | "auth-required"
        | "invalid"
        | "avatar-type"
        | "avatar-size"
        | "avatar-config"
        | "avatar-auth"
        | "avatar-bucket"
        | "avatar-upload";
    };

export async function savePractitionerProfileInline(
  locale: Locale,
  formData: FormData
): Promise<PractitionerProfileActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: "auth-required" };
  }

  const currentProfile = await getMyPractitionerProfile(supabase, user.id);
  const avatarFile = formData.get("avatarImage");
  const currentProfileImageUrl = formData.get("profileImageUrl");
  let profileImageUrl =
    typeof currentProfileImageUrl === "string" && currentProfileImageUrl.trim()
      ? currentProfileImageUrl
      : null;
  const previousAvatarKey = getManagedAvatarKeyFromUrl(currentProfile?.profileImageUrl ?? null);
  let uploadedAvatarKey: string | null = null;

  if (isUploadedFile(avatarFile) && avatarFile.size > 0) {
    const upload = await uploadPractitionerAvatar(user.id, avatarFile);

    if (!upload.ok) {
      return { ok: false, status: upload.code };
    }

    profileImageUrl = upload.url;
    uploadedAvatarKey = upload.key;
  }

  const practiceLocations = parsePracticeLocations(formData.get("practiceLocations"));
  const primaryLocation = practiceLocations[0] ?? null;
  const parsed = practitionerProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    officialFullName: formData.get("officialFullName"),
    bio: formData.get("bio"),
    country: formData.get("country"),
    city: formData.get("city"),
    latitude: primaryLocation?.latitude ?? null,
    longitude: primaryLocation?.longitude ?? null,
    practiceLocations,
    languages: parseLanguages(formData.get("languages")),
    website: formData.get("website"),
    instagramUrl: formData.get("instagramUrl"),
    facebookUrl: formData.get("facebookUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    tiktokUrl: formData.get("tiktokUrl"),
    profileImageUrl,
  });

  if (!parsed.success) {
    return { ok: false, status: "invalid" };
  }

  const fullName = parsed.data.fullName ?? null;
  const officialFullName = parsed.data.officialFullName ?? null;

  await supabase.auth.updateUser({
    data: {
      full_name: fullName ?? undefined,
      avatar_url: profileImageUrl ?? undefined,
    },
  });

  const fullNameRpcClient = supabase as unknown as FullNameRpcClient;
  const { error: userUpdateError } = await fullNameRpcClient.rpc("update_current_user_full_name", {
    target_user_id: user.id,
    target_full_name: fullName,
    target_official_full_name: officialFullName,
  });

  if (userUpdateError) {
    return { ok: false, status: "invalid" };
  }

  await saveMyPractitionerProfile(supabase, user.id, parsed.data);

  if (uploadedAvatarKey && previousAvatarKey && previousAvatarKey !== uploadedAvatarKey) {
    await deletePrivateR2Object(previousAvatarKey).catch((error: unknown) => {
      console.error("Previous practitioner avatar could not be deleted.", error);
    });
  }

  revalidatePath(`/${locale}/dashboard/profile`);
  revalidatePath(`/${locale}/practitioners`);
  return { ok: true, status: "saved" };
}

export async function savePractitionerProfile(locale: Locale, formData: FormData) {
  const result = await savePractitionerProfileInline(locale, formData);

  if (result.status === "auth-required") {
    redirect(`/${locale}/login?status=auth-required`);
  }

  if (!result.ok) {
    redirect(`/${locale}/dashboard/profile?status=${result.status}`);
  }

  redirect(`/${locale}/dashboard/profile?status=saved`);
}

export type ProfileVisibilityActionResult =
  | { ok: true; status: "saved" }
  | { ok: false; status: "auth-required" | "invalid" | "error" };

export async function saveProfileVisibilityInline(
  locale: Locale,
  formData: FormData
): Promise<ProfileVisibilityActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: "auth-required" };
  }

  const parsed = profileVisibilitySchema.safeParse({
    directory: formData.get("directory"),
    displayName: formData.get("displayName"),
    profileImage: formData.get("profileImage"),
    bio: formData.get("bio"),
    languages: formData.get("languages"),
    location: formData.get("location"),
    website: formData.get("website"),
    socialLinks: formData.get("socialLinks"),
  });

  if (!parsed.success) {
    return { ok: false, status: "invalid" };
  }

  try {
    await saveMyProfileVisibility(supabase, user.id, parsed.data);
  } catch {
    return { ok: false, status: "error" };
  }

  revalidatePath(`/${locale}/dashboard/profile`);
  revalidatePath(`/${locale}/practitioners`);
  revalidatePath(`/${locale}/dashboard/first-steps`);
  return { ok: true, status: "saved" };
}
