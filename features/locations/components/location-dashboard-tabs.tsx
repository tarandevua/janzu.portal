"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type LocationDashboardTab = "submitted" | "approvals" | "deleted";

type LocationDashboardTabsProps = {
  activeTab: LocationDashboardTab;
  tabs: {
    value: LocationDashboardTab;
    label: string;
    href: Route;
    content: ReactNode;
  }[];
};

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </CardContent>
    </Card>
  );
}

export function LocationDashboardTabs({ activeTab, tabs }: LocationDashboardTabsProps) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(activeTab);
  const [isPending, startTransition] = useTransition();
  const availableTabValues = tabs.map((tab) => tab.value);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  function handleTabChange(nextTab: string) {
    if (!availableTabValues.includes(nextTab as LocationDashboardTab)) {
      return;
    }

    const tab = nextTab as LocationDashboardTab;
    const tabConfig = tabs.find((item) => item.value === tab);

    if (!tabConfig) {
      return;
    }

    setSelectedTab(tab);
    startTransition(() => {
      router.push(tabConfig.href);
    });
  }

  return (
    <Tabs value={selectedTab} className="grid gap-4">
      <TabsList className="h-auto w-full justify-start overflow-x-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link
              href={tab.href}
              onClick={(event) => {
                if (tab.value === selectedTab) {
                  return;
                }

                event.preventDefault();
                handleTabChange(tab.value);
              }}
            >
              {tab.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0">
          {isPending && selectedTab === tab.value && activeTab !== tab.value
            ? <LoadingSkeleton />
            : tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
