"use client";

import type { ReactNode } from "react";
import { PlusIcon, XIcon } from "lucide-react";
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

type DashboardActionDrawerProps = {
  children: ReactNode;
  title: string;
  description?: string;
  triggerLabel: string;
  cancelLabel?: string;
  closeLabel?: string;
  defaultOpen?: boolean;
};

export function DashboardActionDrawer({
  children,
  title,
  description,
  triggerLabel,
  cancelLabel = "Cancel",
  closeLabel = "Close",
  defaultOpen = false,
}: DashboardActionDrawerProps) {
  return (
    <Drawer direction="right" defaultOpen={defaultOpen} handleOnly>
      <DrawerTrigger asChild>
        <Button type="button">
          <PlusIcon className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="inset-x-auto bottom-0 left-auto right-0 top-0 mt-0 flex h-[100dvh] max-h-[100dvh] w-[min(100vw,36rem)] max-w-[100vw] overflow-hidden rounded-none border-l">
        <DrawerHeader className="relative shrink-0 border-b pr-14 text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          <DrawerClose asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-3 top-3 h-8 w-8"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">{closeLabel}</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
        <DrawerFooter className="shrink-0 border-t bg-background">
          <DrawerClose asChild>
            <Button type="button" variant="outline" className="w-full">
              {cancelLabel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
