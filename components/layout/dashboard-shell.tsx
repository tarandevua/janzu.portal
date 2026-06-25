import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Role, RoleAccess } from "@/server/models/rbac.model";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DashboardShellProps = {
  locale: Locale;
  activeRole?: Role;
  access: RoleAccess[];
  children: React.ReactNode;
};

export function DashboardShell({ locale, activeRole, access, children }: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Janzu</p>
              <h1 className="text-lg font-semibold">Community Portal</h1>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {access.map((item) => (
              <Button key={item.role} asChild variant={item.role === activeRole ? "default" : "outline"} size="sm">
                <Link href={`/${locale}/dashboard/${item.dashboardPath}`}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Access</p>
          <div className="flex flex-wrap gap-2 lg:flex-col">
            {access.length > 0 ? (
              access.map((item) => (
                <Badge key={item.role} variant={item.role === activeRole ? "default" : "secondary"}>
                  {item.label}
                </Badge>
              ))
            ) : (
              <Badge variant="outline">Pending</Badge>
            )}
          </div>
        </aside>

        <section>{children}</section>
      </div>
    </main>
  );
}
