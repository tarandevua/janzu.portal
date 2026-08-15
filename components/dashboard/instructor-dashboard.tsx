import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import type { Locale } from "@/lib/i18n/config";
import type { RoleAccess } from "@/server/models/rbac.model";

export function InstructorDashboard({
  locale,
  access,
  user,
  title,
  dictionary,
}: {
  locale: Locale;
  access: RoleAccess[];
  user: { id: string; name: string; email: string; avatar?: string };
  title: string;
  dictionary: { description: string; supervision: string; training: string };
}) {
  return (
    <JanzuDashboardFrame locale={locale} access={access} user={user} title={title}>
      <div className="grid gap-4 p-4 md:grid-cols-2 md:p-6">
        <Card><CardHeader><CardTitle>{dictionary.supervision}</CardTitle><CardDescription>{dictionary.description}</CardDescription></CardHeader><CardContent><Button asChild><Link href={`/${locale}/dashboard/supervision`}>{dictionary.supervision}</Link></Button></CardContent></Card>
        <Card><CardHeader><CardTitle>{dictionary.training}</CardTitle><CardDescription>{dictionary.description}</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href={`/${locale}/dashboard/training`}>{dictionary.training}</Link></Button></CardContent></Card>
      </div>
    </JanzuDashboardFrame>
  );
}
