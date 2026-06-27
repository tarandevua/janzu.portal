"use client";

import type { ReactNode } from "react";
import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

type LocationEditDrawerProps = {
  children: ReactNode;
  title: string;
  description?: string;
  triggerLabel: string;
};

export function LocationEditDrawer({
  children,
  title,
  description,
  triggerLabel,
}: LocationEditDrawerProps) {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <PencilIcon className="size-4" />
          {triggerLabel}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="inset-x-auto bottom-0 left-auto right-0 top-0 mt-0 h-full w-[min(100vw,36rem)] max-w-[100vw] overflow-x-hidden overflow-y-auto rounded-none border-l">
        <DrawerHeader className="border-b text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="min-w-0 p-4">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
