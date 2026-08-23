"use client";

import { useState, type FormEvent } from "react";
import { SendIcon } from "lucide-react";
import { toast } from "sonner";
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
  dictionary: {
    inviteTitle: string;
    inviteDescription: string;
    fullName: string;
    email: string;
    assignRole: string;
    invite: string;
    invited: string;
    inviteInvalid: string;
    inviteFailed: string;
    roleLabels: Record<Role, string>;
  };
};

export function UserInviteForm({
  locale,
  actorRoles,
  dictionary,
}: UserInviteFormProps) {
  const action = inviteUser.bind(null, locale);
  const [isPending, setIsPending] = useState(false);
  const assignableRoles = roles.filter((role) => canManageUserRole(actorRoles, role));
  const defaultRole = assignableRoles.includes("apprentice") ? "apprentice" : assignableRoles[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    setIsPending(true);

    try {
      const result = await action(new FormData(form));

      if (result.ok) {
        toast.success(dictionary.invited);
        form.reset();
        return;
      }

      toast.error(result.status === "invalid" ? dictionary.inviteInvalid : dictionary.inviteFailed);
    } catch {
      toast.error(dictionary.inviteFailed);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">{dictionary.fullName}</Label>
        <Input id="fullName" name="fullName" disabled={isPending} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{dictionary.email}</Label>
        <Input id="email" name="email" type="email" disabled={isPending} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">{dictionary.assignRole}</Label>
        <Select name="role" defaultValue={defaultRole} disabled={isPending} required>
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
      <Button type="submit" disabled={isPending}>
        <SendIcon className="h-4 w-4" />
        {dictionary.invite}
      </Button>
    </form>
  );
}
