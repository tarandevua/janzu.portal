"use client";

import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { EditIcon, XIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Client } from "@/server/models/client.model";
import { ClientForm } from "@/features/clients/components/client-form";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

type ClientEditDrawerProps = {
  client: Client;
  locale: Locale;
  status?: string;
  shouldOpen?: boolean;
  dictionary: {
    edit: string;
    editFormTitle: string;
    editFormDescription: string;
    cancel: string;
    close: string;
  } & ComponentProps<typeof ClientForm>["dictionary"];
};

export function ClientEditDrawer({
  client,
  locale,
  status,
  shouldOpen = false,
  dictionary,
}: ClientEditDrawerProps) {
  const [open, setOpen] = useState(shouldOpen);

  useEffect(() => {
    if (shouldOpen) {
      setOpen(true);
    }
  }, [shouldOpen]);

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen} handleOnly>
      <DrawerTrigger asChild>
        <Button type="button" size="icon" variant="ghost">
          <EditIcon className="h-4 w-4" />
          <span className="sr-only">{dictionary.edit}</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="inset-x-auto bottom-0 left-auto right-0 top-0 mt-0 flex h-[100dvh] max-h-[100dvh] w-[min(100vw,36rem)] max-w-[100vw] overflow-hidden rounded-none border-l">
        <DrawerHeader className="relative shrink-0 border-b pr-14 text-left">
          <DrawerTitle>{dictionary.editFormTitle}</DrawerTitle>
          <DrawerDescription>{dictionary.editFormDescription}</DrawerDescription>
          <DrawerClose asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-3 top-3 h-8 w-8"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">{dictionary.close}</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
          <ClientForm
            locale={locale}
            status={status}
            variant="plain"
            mode="edit"
            client={client}
            onSuccess={() => setOpen(false)}
            dictionary={dictionary}
          />
        </div>
        <DrawerFooter className="shrink-0 border-t bg-background">
          <DrawerClose asChild>
            <Button type="button" variant="outline" className="w-full">
              {dictionary.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
