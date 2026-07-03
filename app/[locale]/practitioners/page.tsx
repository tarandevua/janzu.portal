import Link from "next/link";
import { Shell } from "lucide-react";
import { PublicPractitionerDirectory } from "@/features/practitioners/components/public-practitioner-directory";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findPublicPractitionerProfiles } from "@/server/services/practitioner.service";

type PractitionersPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function PractitionersPage({ params }: PractitionersPageProps) {
  const { locale } = await params;
  const [dictionary, supabase] = await Promise.all([
    getDictionary(locale),
    createSupabaseServerClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profiles = await findPublicPractitionerProfiles(supabase);

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <section className="mx-auto grid max-w-6xl gap-6">
        <div>
          {user ? (
              <Button asChild variant="ghost" className="w-fit">
                <Link href={`/${locale}`}>
                  <Shell className="h-5 w-5" />
                  <span className="text-base font-semibold">Janzu Portal</span>
                </Link>
              </Button>
            ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold">{dictionary.practitioners.public.title}</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {dictionary.practitioners.public.description}
          </p>
        </div>

        <PublicPractitionerDirectory
          locale={locale}
          profiles={profiles}
          dictionary={dictionary.practitioners.public}
        />
      </section>
    </main>
  );
}
