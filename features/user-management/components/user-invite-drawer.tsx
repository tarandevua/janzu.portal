"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DashboardActionDrawer } from "@/components/dashboard/dashboard-action-drawer";
import {
  UserInviteForm,
  type UserInviteDictionary,
} from "@/features/user-management/components/user-invite-form";
import type { Locale } from "@/lib/i18n/config";
import type { Role } from "@/server/models/rbac.model";

type UserInviteDrawerProps = {
  locale: Locale;
  actorRoles: Role[];
  dictionary: UserInviteDictionary;
  cancelLabel: string;
  closeLabel: string;
  defaultOpen?: boolean;
};

export function UserInviteDrawer({
  locale,
  actorRoles,
  dictionary,
  cancelLabel,
  closeLabel,
  defaultOpen = false,
}: UserInviteDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [, startTransition] = useTransition();

  function handleUserCreated() {
    setOpen(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <DashboardActionDrawer
      title={dictionary.inviteTitle}
      description={dictionary.inviteDescription}
      triggerLabel={dictionary.invite}
      cancelLabel={cancelLabel}
      closeLabel={closeLabel}
      open={open}
      onOpenChange={setOpen}
    >
      <UserInviteForm
        locale={locale}
        actorRoles={actorRoles}
        dictionary={dictionary}
        onUserCreated={handleUserCreated}
      />
    </DashboardActionDrawer>
  );
}
