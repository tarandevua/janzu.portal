import Link from "next/link";
import type { Route } from "next";
import { ClusteredMap } from "@/features/maps/components/clustered-map";
import type { MapMarker } from "@/features/maps/types";
import { hasValidCoordinates } from "@/features/maps/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findPublicPractitionerProfiles } from "@/server/services/practitioner.service";

type PractitionersPageProps = {
  params: Promise<{ locale: Locale }>;
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

export default async function PractitionersPage({ params }: PractitionersPageProps) {
  const { locale } = await params;
  const [dictionary, supabase] = await Promise.all([
    getDictionary(locale),
    createSupabaseServerClient(),
  ]);
  const profiles = await findPublicPractitionerProfiles(supabase);
  const markers: MapMarker[] = profiles.filter(hasValidCoordinates).map((profile) => ({
    id: profile.id,
    kind: "practitioner",
    title: getPractitionerName(profile, dictionary.practitioners.public.unknownCity),
    description: profile.bio,
    latitude: profile.latitude,
    longitude: profile.longitude,
    href: `/${locale}/practitioners/${profile.id}`,
    meta: [profile.country, profile.city].filter(Boolean).join(", "),
  }));

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <section className="mx-auto grid max-w-6xl gap-6">
        <div>
          <h1 className="text-3xl font-semibold">{dictionary.practitioners.public.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {dictionary.practitioners.public.description}
          </p>
        </div>

        <ClusteredMap
          markers={markers}
          emptyText={dictionary.practitioners.public.emptyMap}
          className="min-h-[460px]"
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => {
            const practitionerName = getPractitionerName(
              profile,
              dictionary.practitioners.public.unknownCity
            );

            return (
            <Link key={profile.id} href={`/${locale}/practitioners/${profile.id}` as Route}>
              <Card className="h-full transition-colors hover:bg-accent/40">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 rounded-lg">
                      <AvatarImage src={profile.profileImageUrl ?? ""} alt={practitionerName} />
                      <AvatarFallback className="rounded-lg">
                        {getAvatarFallback(practitionerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="truncate">{practitionerName}</CardTitle>
                      <CardDescription>
                        {[profile.country, profile.city].filter(Boolean).join(", ")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-3 text-sm text-muted-foreground">{profile.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((language) => (
                      <Badge key={language} variant="secondary">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
