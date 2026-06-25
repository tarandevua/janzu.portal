import type { Role } from "@/server/models/rbac.model";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RoleDashboardProps = {
  title: string;
  description: string;
  activeRole: Role;
  permissions: string[];
};

export function RoleDashboard({ title, description, activeRole, permissions }: RoleDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2">
          <Badge variant="secondary">{activeRole}</Badge>
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {permissions.map((permission) => (
            <div key={permission} className="rounded-md border bg-background p-3 text-sm">
              {permission}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
