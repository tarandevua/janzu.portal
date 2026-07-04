"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ClusteredMap } from "@/features/maps/components/clustered-map";
import type { MapMarker, PractitionerMarkerGroup } from "@/features/maps/types";
import { hasValidCoordinates } from "@/features/maps/utils";
import { stripRichTextHtml } from "@/features/practitioners/utils/profile-text";
import type { Locale } from "@/lib/i18n/config";
import type { PractitionerProfile } from "@/server/models/practitioner.model";

type PublicPractitionerDirectoryDictionary = {
  unknownCity: string;
  emptyMap: string;
  apprenticePin: string;
  participantPin: string;
  facilitatorPin: string;
  emptyGroup: string;
  viewDetails: string;
};

type PublicPractitionerDirectoryProps = {
  locale: Locale;
  profiles: PractitionerProfile[];
  dictionary: PublicPractitionerDirectoryDictionary;
};

const practitionerGroups: PractitionerMarkerGroup[] = ["apprentice", "participant"]; // "facilitator"

const groupColorClassName: Record<PractitionerMarkerGroup, string> = {
  apprentice: "bg-[#d97706]",
  participant: "bg-primary",
  facilitator: "bg-[#4f46e5]",
};

function getPractitionerName(profile: { displayName?: string | null; city: string | null }, fallback: string) {
  return profile.displayName?.trim() || profile.city || fallback;
}

function getAvatarFallback(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return (words[0]?.slice(0, 2) || "JP").toUpperCase();
}

function getGroupLabel(dictionary: PublicPractitionerDirectoryDictionary, group: PractitionerMarkerGroup) {
  return dictionary[`${group}Pin`];
}

export function PublicPractitionerDirectory({
  locale,
  profiles,
  dictionary,
}: PublicPractitionerDirectoryProps) {
  const [activeGroup, setActiveGroup] = useState<PractitionerMarkerGroup | null>(null);
  const filteredProfiles = useMemo(
    () => profiles.filter((profile) => !activeGroup || profile.publicGroup === activeGroup),
    [activeGroup, profiles]
  );
  const markers: MapMarker[] = useMemo(
    () =>
      filteredProfiles.flatMap((profile) =>
        profile.practiceLocations.filter(hasValidCoordinates).map((location, index) => ({
          id: `${profile.id}-${index}`,
          kind: "practitioner" as const,
          practitionerGroup: profile.publicGroup,
          title: getPractitionerName(profile, dictionary.unknownCity),
          description: stripRichTextHtml(profile.bio),
          imageUrl: profile.profileImageUrl,
          fallbackText: getAvatarFallback(getPractitionerName(profile, dictionary.unknownCity)),
          note: location.note,
          latitude: location.latitude,
          longitude: location.longitude,
          href: `/${locale}/practitioners/${profile.id}`,
          meta: [location.country ?? profile.country, location.city ?? profile.city].filter(Boolean).join(", "),
        }))
      ),
    [dictionary.unknownCity, filteredProfiles, locale]
  );

  return (
    <>
      <ClusteredMap
        markers={markers}
        emptyText={dictionary.emptyMap}
        className="min-h-[460px]"
      />
      <ToggleGroup
        type="single"
        value={activeGroup ?? ""}
        onValueChange={(value) => {
          setActiveGroup(value ? (value as PractitionerMarkerGroup) : null);
        }}
        className="flex-wrap justify-start"
        aria-label="Filter practitioners by group"
      >
        {practitionerGroups.map((group) => (
          <ToggleGroupItem key={group} value={group} className="gap-2">
            <span className={`h-3 w-3 rounded-full ${groupColorClassName[group]}`} />
            {getGroupLabel(dictionary, group)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProfiles.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-6 text-sm text-muted-foreground">
              {dictionary.emptyGroup}
            </CardContent>
          </Card>
        ) : filteredProfiles.map((profile) => {
          const practitionerName = getPractitionerName(profile, dictionary.unknownCity);
          const profileHref = `/${locale}/practitioners/${profile.id}` as Route;
          const bioPreview = stripRichTextHtml(profile.bio);

          return (
            <Card key={profile.id} className="flex h-full flex-col transition-colors hover:bg-accent/40">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Avatar className="h-20 w-20 shrink-0 rounded-lg">
                    <AvatarImage
                      src={profile.profileImageUrl ?? ""}
                      alt={practitionerName}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-lg">
                      {getAvatarFallback(practitionerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="truncate">{practitionerName}</CardTitle>
                    <CardDescription>
                      {[profile.country, profile.city].filter(Boolean).join(", ")}
                    </CardDescription>
                    <Badge className={`mt-2 ${groupColorClassName[profile.publicGroup]}`}>
                      {getGroupLabel(dictionary, profile.publicGroup)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-3">
                <p className="line-clamp-3 min-h-[100px] text-sm text-muted-foreground">{bioPreview}</p>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((language) => (
                    <Badge key={language} variant="secondary">
                      {language}
                    </Badge>
                  ))}
                </div>
                <div className="mt-auto pt-2">
                  <Button asChild size="sm">
                    <Link href={profileHref} prefetch>
                      {dictionary.viewDetails}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
