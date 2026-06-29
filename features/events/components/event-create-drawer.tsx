import type { ReactNode } from "react";
import { DashboardActionDrawer } from "@/components/dashboard/dashboard-action-drawer";

type EventCreateDrawerProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  dictionary: {
    createButton: string;
    formTitle: string;
    formDescription: string;
    cancel?: string;
    close?: string;
  };
};

export function EventCreateDrawer({
  children,
  defaultOpen = false,
  dictionary,
}: EventCreateDrawerProps) {
  return (
    <DashboardActionDrawer
      title={dictionary.formTitle}
      description={dictionary.formDescription}
      triggerLabel={dictionary.createButton}
      cancelLabel={dictionary.cancel}
      closeLabel={dictionary.close}
      defaultOpen={defaultOpen}
    >
      {children}
    </DashboardActionDrawer>
  );
}
