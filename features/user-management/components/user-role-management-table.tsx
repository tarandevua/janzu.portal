import { PlusIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assignUserRole, removeUserRole } from "@/features/user-management/actions";
import type { Locale } from "@/lib/i18n/config";
import { roles, type ManagedUser, type Role } from "@/server/models/rbac.model";
import { canManageUserRole } from "@/server/services/rbac.service";

type UserManagementDictionary = {
  title: string;
  description: string;
  user: string;
  email: string;
  roles: string;
  created: string;
  assignRole: string;
  removeRole: string;
  action: string;
  empty: string;
  assigned: string;
  removed: string;
  invalid: string;
  forbidden: string;
  roleLabels: Record<Role, string>;
};

type UserRoleManagementTableProps = {
  locale: Locale;
  users: ManagedUser[];
  actorRoles: Role[];
  status?: string;
  dictionary: UserManagementDictionary;
};

function formatCreatedAt(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function UserRoleManagementTable({
  locale,
  users,
  actorRoles,
  status,
  dictionary,
}: UserRoleManagementTableProps) {
  const assignAction = assignUserRole.bind(null, locale);
  const removeAction = removeUserRole.bind(null, locale);
  const assignableRoles = roles.filter((role) => canManageUserRole(actorRoles, role));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "assigned" ? (
          <p className="mb-4 text-sm font-medium text-emerald-700">{dictionary.assigned}</p>
        ) : null}
        {status === "removed" ? (
          <p className="mb-4 text-sm font-medium text-emerald-700">{dictionary.removed}</p>
        ) : null}
        {status === "invalid" ? (
          <p className="mb-4 text-sm font-medium text-destructive">{dictionary.invalid}</p>
        ) : null}
        {status === "forbidden" ? (
          <p className="mb-4 text-sm font-medium text-destructive">{dictionary.forbidden}</p>
        ) : null}
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.user}</TableHead>
                  <TableHead>{dictionary.email}</TableHead>
                  <TableHead>{dictionary.roles}</TableHead>
                  <TableHead>{dictionary.created}</TableHead>
                  <TableHead>{dictionary.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((managedUser) => (
                  <TableRow key={managedUser.userId}>
                    <TableCell className="font-medium">
                      {managedUser.fullName ?? managedUser.email}
                    </TableCell>
                    <TableCell>{managedUser.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {managedUser.roles.map((role) => (
                          <form key={role} action={removeAction}>
                            <input type="hidden" name="userId" value={managedUser.userId} />
                            <input type="hidden" name="role" value={role} />
                            <Badge
                              variant={canManageUserRole(actorRoles, role) ? "secondary" : "outline"}
                              className="gap-1"
                            >
                              {dictionary.roleLabels[role]}
                              {canManageUserRole(actorRoles, role) ? (
                                <button
                                  type="submit"
                                  className="ml-1 inline-flex rounded-sm opacity-80 hover:opacity-100"
                                  aria-label={`${dictionary.removeRole} ${dictionary.roleLabels[role]}`}
                                >
                                  <XIcon className="h-3 w-3" />
                                </button>
                              ) : null}
                            </Badge>
                          </form>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatCreatedAt(locale, managedUser.createdAt)}
                    </TableCell>
                    <TableCell>
                      <form action={assignAction} className="flex min-w-48 gap-2">
                        <input type="hidden" name="userId" value={managedUser.userId} />
                        <Select name="role">
                          <SelectTrigger aria-label={dictionary.assignRole}>
                            <SelectValue placeholder={dictionary.assignRole} />
                          </SelectTrigger>
                          <SelectContent>
                            {assignableRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {dictionary.roleLabels[role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="submit" size="icon" variant="outline" aria-label={dictionary.assignRole}>
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
