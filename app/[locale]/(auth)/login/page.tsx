import { MagicLinkForm } from "@/features/auth/components/magic-link-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

type LoginPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const dictionary = await getDictionary(locale);
  const auth = dictionary.auth.login;

  return (
    <main className="flex min-h-screen bg-muted/40">
      <section className="hidden w-1/2 bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="text-sm font-medium tracking-wide">Janzu Community Portal</div>
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-semibold leading-tight">{auth.heroTitle}</h1>
          <p className="text-base leading-7 text-primary-foreground/85">{auth.heroBody}</p>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
          <MagicLinkForm dictionary={auth} locale={locale} status={status} />
        </div>
      </section>
    </main>
  );
}
