"use client";

import { useState } from "react";
import { DashboardActionDrawer } from "@/components/dashboard/dashboard-action-drawer";
import { SessionForm, type SessionFormProps } from "@/features/sessions/components/session-form";

type SessionCreateDrawerProps = Pick<SessionFormProps, "locale" | "clients" | "dictionary"> & {
  cancelLabel: string;
  closeLabel: string;
  defaultOpen?: boolean;
};

export function SessionCreateDrawer({
  locale,
  clients,
  dictionary,
  cancelLabel,
  closeLabel,
  defaultOpen = false,
}: SessionCreateDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <DashboardActionDrawer
      title={dictionary.formTitle}
      description={dictionary.formDescription}
      triggerLabel={dictionary.formTitle}
      cancelLabel={cancelLabel}
      closeLabel={closeLabel}
      open={open}
      onOpenChange={setOpen}
    >
      <SessionForm
        locale={locale}
        clients={clients}
        variant="plain"
        dictionary={dictionary}
        onSuccess={() => setOpen(false)}
      />
    </DashboardActionDrawer>
  );
}
