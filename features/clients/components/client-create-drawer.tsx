"use client";

import type { ComponentProps } from "react";
import { useState } from "react";
import { DashboardActionDrawer } from "@/components/dashboard/dashboard-action-drawer";
import type { Locale } from "@/lib/i18n/config";
import { ClientForm } from "@/features/clients/components/client-form";

type ClientCreateDrawerProps = {
  locale: Locale;
  status?: string;
  defaultOpen?: boolean;
  cancelLabel: string;
  closeLabel: string;
  dictionary: ComponentProps<typeof ClientForm>["dictionary"];
};

export function ClientCreateDrawer({
  locale,
  status,
  defaultOpen = false,
  cancelLabel,
  closeLabel,
  dictionary,
}: ClientCreateDrawerProps) {
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
      <ClientForm
        locale={locale}
        status={status}
        variant="plain"
        onSuccess={() => setOpen(false)}
        dictionary={dictionary}
      />
    </DashboardActionDrawer>
  );
}
