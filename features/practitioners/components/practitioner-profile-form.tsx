"use client";

import { useEffect, useRef, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleHelpIcon } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";
import type { PractitionerProfile } from "@/server/models/practitioner.model";
import {
  savePractitionerProfileInline,
  type PractitionerProfileActionResult,
} from "@/features/practitioners/actions";
import { RichTextEditor } from "@/components/rich-text-editor";
import { MultiCoordinatePicker } from "@/features/maps/components/multi-coordinate-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PractitionerProfileFormProps = {
  locale: Locale;
  profile: PractitionerProfile | null;
  fullName: string;
  officialFullName: string;
  dictionary: {
    title: string;
    description: string;
    fullName: string;
    officialFullName: string;
    officialFullNameHelp: string;
    bio: string;
    bold: string;
    underline: string;
    link: string;
    linkPrompt: string;
    country: string;
    city: string;
    latitude: string;
    longitude: string;
    mapPickerTitle: string;
    mapPickerDescription: string;
    selectedCoordinates: string;
    noCoordinatesSelected: string;
    removeLocation: string;
    locationNotePlaceholder: string;
    languages: string;
    website: string;
    instagram: string;
    facebook: string;
    youtube: string;
    tiktok: string;
    profileImageUrl: string;
    profileImageUpload: string;
    profileImageUploadHelp: string;
    save: string;
    saved: string;
    invalid: string;
    avatarType: string;
    avatarSize: string;
    avatarConfig: string;
    avatarAuth: string;
    avatarBucket: string;
    avatarUpload: string;
  };
  status?: string;
};

const statusMessages = {
  saved: "saved",
  "auth-required": "invalid",
  invalid: "invalid",
  "avatar-type": "avatarType",
  "avatar-size": "avatarSize",
  "avatar-config": "avatarConfig",
  "avatar-auth": "avatarAuth",
  "avatar-bucket": "avatarBucket",
  "avatar-upload": "avatarUpload",
} as const;

function getStatusMessage(
  dictionary: PractitionerProfileFormProps["dictionary"],
  statusValue: PractitionerProfileActionResult["status"] | string
) {
  const messageKey = statusMessages[statusValue as keyof typeof statusMessages] ?? "invalid";

  return dictionary[messageKey];
}

function getAvatarFallback(fullName: string) {
  const words = fullName.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return (words[0]?.slice(0, 2) || "JP").toUpperCase();
}

export function PractitionerProfileForm({
  locale,
  profile,
  fullName,
  officialFullName,
  dictionary,
  status,
}: PractitionerProfileFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const message = status ? getStatusMessage(dictionary, status) : null;
  const avatarFallback = getAvatarFallback(fullName);

  useEffect(() => {
    if (!message) {
      return;
    }

    if (status === "saved") {
      toast.success(message);
      return;
    }

    toast.error(message);
  }, [message, status]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = formRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);

    startTransition(() => {
      void savePractitionerProfileInline(locale, formData).then((result) => {
        const nextMessage = getStatusMessage(dictionary, result.status);

        if (result.ok) {
          toast.success(nextMessage);
          router.refresh();
          return;
        }

        toast.error(nextMessage);
      });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data" className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="avatarImage">{dictionary.profileImageUpload}</Label>
              <div className="flex items-center gap-3">
                <Avatar className="h-24 w-24 shrink-0 rounded-lg">
                  <AvatarImage src={profile?.profileImageUrl ?? ""} alt={fullName} className="object-cover" />
                  <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 gap-1">
                  <input
                    type="hidden"
                    id="profileImageUrl"
                    name="profileImageUrl"
                    value={profile?.profileImageUrl ?? ""}
                  />
                  <Input
                    id="avatarImage"
                    name="avatarImage"
                    type="file"
                    accept="image/jpeg,.jpg,.jpeg"
                  />
                  <p className="text-xs text-muted-foreground">{dictionary.profileImageUploadHelp}</p>
                </div>
              </div>
              <Label className="sr-only" htmlFor="profileImageUrl">
                {dictionary.profileImageUrl}
              </Label>
            </div>
            <div></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fullName">{dictionary.fullName}</Label>
              <Input id="fullName" name="fullName" defaultValue={fullName} />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="officialFullName">{dictionary.officialFullName}</Label>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={dictionary.officialFullNameHelp}
                      >
                        <CircleHelpIcon className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-72">
                      <p>{dictionary.officialFullNameHelp}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input id="officialFullName" name="officialFullName" defaultValue={officialFullName} />
            </div>
          </div>

          <RichTextEditor
            id="bio"
            name="bio"
            label={dictionary.bio}
            defaultValue={profile?.bio}
            dictionary={dictionary}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="country">{dictionary.country}</Label>
              <Input id="country" name="country" defaultValue={profile?.country ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">{dictionary.city}</Label>
              <Input id="city" name="city" defaultValue={profile?.city ?? ""} />
            </div>
          </div>

          <MultiCoordinatePicker
            name="practiceLocations"
            defaultLocations={profile?.practiceLocations ?? []}
            markerGroup={profile?.publicGroup ?? "apprentice"}
            dictionary={dictionary}
          />

          <div className="grid gap-2">
            <Label htmlFor="languages">{dictionary.languages}</Label>
            <Input id="languages" name="languages" defaultValue={profile?.languages.join(", ") ?? ""} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="website">{dictionary.website}</Label>
              <Input id="website" name="website" type="url" defaultValue={profile?.website ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instagramUrl">{dictionary.instagram}</Label>
              <Input
                id="instagramUrl"
                name="instagramUrl"
                autoCapitalize="none"
                autoCorrect="off"
                defaultValue={profile?.instagramUrl ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="facebookUrl">{dictionary.facebook}</Label>
              <Input
                id="facebookUrl"
                name="facebookUrl"
                autoCapitalize="none"
                autoCorrect="off"
                defaultValue={profile?.facebookUrl ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="youtubeUrl">{dictionary.youtube}</Label>
              <Input
                id="youtubeUrl"
                name="youtubeUrl"
                autoCapitalize="none"
                autoCorrect="off"
                defaultValue={profile?.youtubeUrl ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tiktokUrl">{dictionary.tiktok}</Label>
              <Input
                id="tiktokUrl"
                name="tiktokUrl"
                autoCapitalize="none"
                autoCorrect="off"
                defaultValue={profile?.tiktokUrl ?? ""}
              />
            </div>
            
          </div>

          <Button type="submit" className="w-fit" disabled={isPending}>
            {dictionary.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
