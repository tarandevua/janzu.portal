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
    <Drawer direction="right" handleOnly>
      <DrawerTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <PencilIcon className="size-4" />
          {triggerLabel}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="inset-x-auto bottom-0 left-auto right-0 top-0 mt-0 flex h-[100dvh] max-h-[100dvh] w-[min(100vw,36rem)] max-w-[100vw] overflow-hidden rounded-none border-l">
        <DrawerHeader className="shrink-0 border-b text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
