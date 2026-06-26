"use client";

import type { ReactNode } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

type EventCreateDrawerProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  dictionary: {
    createButton: string;
    formTitle: string;
    formDescription: string;
  };
};

export function EventCreateDrawer({
  children,
  defaultOpen = false,
  dictionary,
}: EventCreateDrawerProps) {
  return (
    <Drawer direction="right" defaultOpen={defaultOpen}>
      <DrawerTrigger asChild>
        <Button type="button">
          <PlusIcon />
          {dictionary.createButton}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="inset-x-auto bottom-0 left-auto right-0 top-0 mt-0 h-full w-[min(100vw,36rem)] max-w-[100vw] overflow-x-hidden overflow-y-auto rounded-none border-l">
        <DrawerHeader className="border-b text-left">
          <DrawerTitle>{dictionary.formTitle}</DrawerTitle>
          <DrawerDescription>{dictionary.formDescription}</DrawerDescription>
        </DrawerHeader>
        <div className="min-w-0 p-4">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
