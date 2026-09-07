"use client";

import React, { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  assignUserRoleInline,
  removeUserRoleInline,
  type UserRoleMutationResult,
} from "@/features/user-management/actions";
import type { Locale } from "@/lib/i18n/config";
import type { Role } from "@/server/models/rbac.model";
import { canManageUserRole } from "@/server/services/rbac.service";

type RoleEditorDictionary = {
  assignRole: string;
  removeRole: string;
  assigningRole: string;
  removingRole: string;
  assigned: string;
  removed: string;
  invalid: string;
  roleUpdateFailed: string;
  roleLabels: Record<Role, string>;
};

export function UserRoleEditor({
  locale,
  userId,
  userRoles,
  actorRoles,
  assignableRoles,
  dictionary,
}: {
  locale: Locale;
  userId: string;
  userRoles: Role[];
  actorRoles: Role[];
  assignableRoles: Role[];
  dictionary: RoleEditorDictionary;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function finishMutation(
    result: UserRoleMutationResult,
    toastId: string | number
  ) {
    if (!result.ok) {
      toast.error(
        result.status === "invalid" ? dictionary.invalid : dictionary.roleUpdateFailed,
        { id: toastId }
      );
      return;
    }

    toast.success(
      result.status === "assigned" ? dictionary.assigned : dictionary.removed,
      { id: toastId }
    );
    router.refresh();
  }

  function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const toastId = toast.loading(dictionary.assigningRole);

    startTransition(async () => {
      try {
        finishMutation(await assignUserRoleInline(locale, formData), toastId);
      } catch {
        toast.error(dictionary.roleUpdateFailed, { id: toastId });
      }
    });
  }

  function handleRemove(role: Role) {
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("role", role);
    const toastId = toast.loading(dictionary.removingRole);

    startTransition(async () => {
      try {
        finishMutation(await removeUserRoleInline(locale, formData), toastId);
      } catch {
        toast.error(dictionary.roleUpdateFailed, { id: toastId });
      }
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {userRoles.map((role) => {
          const canRemove = canManageUserRole(actorRoles, role);

          return (
            <Badge
              key={role}
              variant={canRemove ? "secondary" : "outline"}
              className="gap-1"
            >
              {dictionary.roleLabels[role]}
              {canRemove ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRemove(role)}
                  className="ml-1 inline-flex rounded-sm opacity-80 hover:opacity-100 disabled:pointer-events-none disabled:opacity-50"
                  aria-label={`${dictionary.removeRole} ${dictionary.roleLabels[role]}`}
                >
                  <XIcon className="h-3 w-3" />
                </button>
              ) : null}
            </Badge>
          );
        })}
      </div>
      <form onSubmit={handleAssign} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="userId" value={userId} />
        <select
          name="role"
          defaultValue=""
          required
          disabled={isPending}
          aria-label={dictionary.assignRole}
          className="h-10 min-w-48 rounded-md border bg-background px-3 text-sm"
        >
          <option value="" disabled>{dictionary.assignRole}</option>
          {assignableRoles.map((role) => (
            <option key={role} value={role}>
              {dictionary.roleLabels[role]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" disabled={isPending}>
          <PlusIcon className="h-4 w-4" />
          {isPending ? dictionary.assigningRole : dictionary.assignRole}
        </Button>
      </form>
    </div>
  );
}
