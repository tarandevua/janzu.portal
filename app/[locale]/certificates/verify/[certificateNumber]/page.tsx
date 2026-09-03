import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeCertificateNumber } from "@/server/services/certificate-number";
import { verifyCertificateNumber } from "@/server/services/certificate.service";

export default async function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ locale: Locale; certificateNumber: string }>;
}) {
  const { locale, certificateNumber: rawNumber } = await params;
  const [dictionary, supabase] = await Promise.all([
    getDictionary(locale),
    createSupabaseServerClient(),
  ]);
  const certificateNumber = normalizeCertificateNumber(decodeURIComponent(rawNumber));
  const certificate = certificateNumber
    ? await verifyCertificateNumber(supabase, certificateNumber).catch(() => null)
    : null;
  const copy = dictionary.certificateVerification;
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {!certificate ? (
            <div className="rounded-md border border-dashed p-6">
              <p className="font-medium">{copy.notFoundTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{copy.notFoundDescription}</p>
            </div>
          ) : (
            <dl className="grid gap-4 rounded-md border p-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">{copy.status}</dt>
                <dd className="mt-1"><Badge variant={certificate.status === "active" ? "default" : "secondary"}>{copy.statuses[certificate.status]}</Badge></dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{copy.certificateNumber}</dt>
                <dd className="mt-1 font-mono font-medium">{certificate.certificate_number}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{copy.stage}</dt>
                <dd className="mt-1">{copy.practitioner}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{copy.originalDate}</dt>
                <dd className="mt-1">{dateFormatter.format(new Date(`${certificate.original_certification_date}T00:00:00Z`))}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">{copy.issueDate}</dt>
                <dd className="mt-1">{dateFormatter.format(new Date(certificate.issued_at))}</dd>
              </div>
              {certificate.revoked_at ? (
                <div>
                  <dt className="text-sm text-muted-foreground">{copy.revokedDate}</dt>
                  <dd className="mt-1">{dateFormatter.format(new Date(certificate.revoked_at))}</dd>
                </div>
              ) : null}
              {certificate.public_display_name ? (
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground">{copy.publicName}</dt>
                  <dd className="mt-1">{certificate.public_display_name}</dd>
                </div>
              ) : null}
            </dl>
          )}
          <p className="text-sm text-muted-foreground">{copy.privacyNotice}</p>
          <Button asChild variant="outline"><Link href={`/${locale}/login`}>{copy.portal}</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
