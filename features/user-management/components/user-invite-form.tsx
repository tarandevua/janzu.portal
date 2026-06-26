import { SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteUser } from "@/features/user-management/actions";
import type { Locale } from "@/lib/i18n/config";
import { roles, type Role } from "@/server/models/rbac.model";
import { canManageUserRole } from "@/server/services/rbac.service";

type UserInviteFormProps = {
  locale: Locale;
  actorRoles: Role[];
  status?: string;
  dictionary: {
    inviteTitle: string;
    inviteDescription: string;
    fullName: string;
    email: string;
    assignRole: string;
    invite: string;
    invited: string;
    inviteInvalid: string;
    roleLabels: Record<Role, string>;
  };
};

export function UserInviteForm({
  locale,
  actorRoles,
  status,
  dictionary,
}: UserInviteFormProps) {
  const action = inviteUser.bind(null, locale);
  const assignableRoles = roles.filter((role) => canManageUserRole(actorRoles, role));

  return (
    <>
        {status === "invited" ? (
          <p className="mb-4 text-sm font-medium text-emerald-700">{dictionary.invited}</p>
        ) : null}
        {status === "invite-invalid" ? (
          <p className="mb-4 text-sm font-medium text-destructive">{dictionary.inviteInvalid}</p>
        ) : null}
        <form action={action} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{dictionary.fullName}</Label>
            <Input id="fullName" name="fullName" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{dictionary.email}</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">{dictionary.assignRole}</Label>
            <Select name="role" required>
              <SelectTrigger id="role">
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
          </div>
          <Button type="submit">
            <SendIcon className="h-4 w-4" />
            {dictionary.invite}
          </Button>
        </form>
     </>
  );
}
