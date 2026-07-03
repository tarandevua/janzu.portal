import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { ClusteredMap } from "@/features/maps/components/clustered-map";
import type { MapMarker } from "@/features/maps/types";
import { hasValidCoordinates } from "@/features/maps/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const marker: MapMarker[] = profile.practiceLocations.filter(hasValidCoordinates).map((location, index) => ({
    id: `${profile.id}-${index}`,
    kind: "practitioner",
    practitionerGroup: profile.publicGroup,
    title: practitionerName,
    description: profile.bio,
    imageUrl: profile.profileImageUrl,
    fallbackText: getAvatarFallback(practitionerName),
    note: location.note,
    latitude: location.latitude,
    longitude: location.longitude,
    meta: [profile.country, profile.city].filter(Boolean).join(", "),
  }));
  const availableSlots = await listPublicAvailableSlotsByPractitionerId(supabase, profile.id);

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto grid max-w-5xl gap-4">
        <Button asChild variant="ghost" className="w-fit">
          <Link href={`/${locale}/practitioners`}>
            <ArrowLeftIcon className="size-4" />
            {dictionary.practitioners.public.backToList}
          </Link>
        </Button>
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 shrink-0 rounded-lg">
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
                <Badge variant="secondary" className="mt-2">
                  {dictionary.practitioners.public[`${profile.publicGroup}Pin`]}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="sr-only">{dictionary.practitioners.public.profileTitle}</p>
            <p className="leading-7">{profile.bio}</p>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((language) => (
                <Badge key={language} variant="secondary">
                  {language}
                </Badge>
              ))}
            </div>
            {profile.website ? (
              <a
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                href={profile.website}
              >
                {profile.website}
              </a>
            ) : null}
            <ClusteredMap
              markers={marker}
              emptyText={dictionary.practitioners.public.emptyMap}
              className="min-h-[320px]"
            />
          </CardContent>
        </Card>
        <SessionRequestForm
          locale={locale}
          practitionerId={profile.id}
          availableSlots={availableSlots}
          status={status}
          dictionary={dictionary.sessionRequests}
        />
      </div>
    </main>
  );
}
