import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { ClusteredMap } from "@/features/maps/components/clustered-map";
import type { MapMarker, PractitionerMarkerGroup } from "@/features/maps/types";
import { formatCoordinate, hasValidCoordinates } from "@/features/maps/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSelector } from "@/components/language-selector";
import { SessionRequestForm } from "@/features/session-requests/components/session-request-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listPublicAvailableSlotsByPractitionerId } from "@/server/repositories/session-availability.repository";
import { findPublicPractitionerProfile } from "@/server/services/practitioner.service";

type PractitionerPublicProfilePageProps = {
  params: Promise<{ locale: Locale; id: string }>;
  searchParams: Promise<{ status?: string }>;
};

const groupColorClassName: Record<PractitionerMarkerGroup, string> = {
  apprentice: "bg-[#d97706]",
  participant: "bg-primary",
  facilitator: "bg-[#4f46e5]",
  instructor: "bg-[#0f766e]",
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

function getProfileLinks(profile: {
  website: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
}) {
  const instagramUsername = profile.instagramUrl?.replace(/^@/, "");
  const facebookUsername = profile.facebookUrl?.replace(/^@/, "");
  const youtubeUsername = profile.youtubeUrl?.replace(/^@/, "");
  const tiktokUsername = profile.tiktokUrl?.replace(/^@/, "");

  return [
    ["Website", profile.website],
    ["Instagram", instagramUsername ? `https://www.instagram.com/${instagramUsername}` : null],
    ["Facebook", facebookUsername ? `https://www.facebook.com/${facebookUsername}` : null],
    ["YouTube", youtubeUsername ? `https://www.youtube.com/@${youtubeUsername}` : null],
    ["TikTok", tiktokUsername ? `https://www.tiktok.com/@${tiktokUsername}` : null],
  ].filter((link): link is [string, string] => Boolean(link[1]));
}

function getPracticeLocationLabel(location: {
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}) {
  return (
    [location.city, location.country].filter(Boolean).join(", ") ||
    `${formatCoordinate(location.latitude)}, ${formatCoordinate(location.longitude)}`
  );
}

export default async function PractitionerPublicProfilePage({
  params,
  searchParams,
}: PractitionerPublicProfilePageProps) {
  const [{ locale, id }, { status }] = await Promise.all([params, searchParams]);
  const [dictionary, supabase] = await Promise.all([
    getDictionary(locale),
    createSupabaseServerClient(),
  ]);
  const profile = await findPublicPractitionerProfile(supabase, id);

  if (!profile) {
    notFound();
  }

  const practitionerName = getPractitionerName(
    profile,
    dictionary.practitioners.public.unknownCity
  );
  const practiceLocations = profile.practiceLocations.filter(hasValidCoordinates);
  const hasMultiplePracticeLocations = practiceLocations.length > 1;
  const marker: MapMarker[] = practiceLocations.map((location, index) => ({
    id: `${profile.id}-${index}`,
    kind: "practitioner",
    practitionerGroup: profile.publicGroup,
    label: hasMultiplePracticeLocations ? String(index + 1) : undefined,
    popupVariant: "practice-location",
    title: hasMultiplePracticeLocations ? `Location ${index + 1}` : "Location",
    note: location.note,
    latitude: location.latitude,
    longitude: location.longitude,
    meta: getPracticeLocationLabel({
      ...location,
      city: location.city ?? profile.city,
      country: location.country ?? profile.country,
    }),
  }));
  const availableSlots = await listPublicAvailableSlotsByPractitionerId(supabase, profile.id);
  const hasAvailableSlots = availableSlots.length > 0;
  const profileLinks = getProfileLinks(profile);

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" className="w-fit">
          <Link href={`/${locale}/practitioners`}>
            <ArrowLeftIcon className="size-4" />
            {dictionary.practitioners.public.backToList}
          </Link>
        </Button>
        <LanguageSelector locale={locale} />
      </div>
      <div
        className={`mx-auto grid max-w-5xl gap-6 ${
          hasAvailableSlots ? "lg:grid-cols-[1fr_360px]" : ""
        }`}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-48 w-48 shrink-0 rounded-lg">
                <AvatarImage src={profile.profileImageUrl ?? ""} alt={practitionerName} />
                <AvatarFallback className="rounded-lg">
                  {getAvatarFallback(practitionerName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle>{practitionerName}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[profile.country, profile.city].filter(Boolean).join(", ")}
                </p>
                <Badge className={`mt-2 ${groupColorClassName[profile.publicGroup]}`}>
                  {dictionary.practitioners.public[`${profile.publicGroup}Pin`]}
                </Badge>
                <div className="space-y-3">
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.languages.map((language) => (
                      <Badge key={language} variant="secondary">
                        {language}
                      </Badge>
                    ))}
                  </div>
                  {profileLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profileLinks.map(([label, href]) => (
                        <Button key={label} asChild variant="outline" size="sm">
                          <a href={href} target="_blank" rel="noopener noreferrer">
                            {label}
                          </a>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="sr-only">{dictionary.practitioners.public.profileTitle}</p>
            {profile.bio ? (
              <div
                className="prose prose-sm max-w-none leading-7 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_u]:underline"
                dangerouslySetInnerHTML={{ __html: profile.bio }}
              />
            ) : null}
            <ClusteredMap
              markers={marker}
              emptyText={dictionary.practitioners.public.emptyMap}
              className="min-h-[320px]"
            />
            {practiceLocations.length > 0 ? (
              <div className="grid gap-2">
                {practiceLocations.map((location, index) => {
                  const locationLabel = getPracticeLocationLabel({
                    ...location,
                    city: location.city ?? profile.city,
                    country: location.country ?? profile.country,
                  });

                  return (
                    <div key={`${location.latitude}-${location.longitude}-${index}`} className="rounded-md border p-3">
                      <div className="flex items-start gap-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <div className="grid gap-1 text-sm">
                          <p className="font-medium">{locationLabel}</p>
                          {location.note ? <p className="text-muted-foreground">{location.note}</p> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>
        {hasAvailableSlots ? (
          <SessionRequestForm
            locale={locale}
            practitionerId={profile.id}
            availableSlots={availableSlots}
            status={status}
            dictionary={dictionary.sessionRequests}
          />
        ) : null}
      </div>
    </main>
  );
}
