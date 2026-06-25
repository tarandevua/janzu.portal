import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findPublicPractitionerProfile } from "@/server/services/practitioner.service";

type PractitionerPublicProfilePageProps = {
  params: Promise<{ locale: Locale; id: string }>;
};

export default async function PractitionerPublicProfilePage({
  params,
}: PractitionerPublicProfilePageProps) {
  const { locale, id } = await params;
  const [dictionary, supabase] = await Promise.all([
    getDictionary(locale),
    createSupabaseServerClient(),
  ]);
  const profile = await findPublicPractitionerProfile(supabase, id);

  if (!profile) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>{dictionary.practitioners.public.profileTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {[profile.country, profile.city].filter(Boolean).join(", ")}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="leading-7">{profile.bio}</p>
          <div className="flex flex-wrap gap-2">
            {profile.languages.map((language) => (
              <Badge key={language} variant="secondary">
                {language}
              </Badge>
            ))}
          </div>
          {profile.website ? (
            <a className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={profile.website}>
              {profile.website}
            </a>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
