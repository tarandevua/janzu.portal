"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sessionTabs = ["history", "requests", "availability"] as const;

export type SessionDashboardTab = (typeof sessionTabs)[number];

type SessionDashboardTabsProps = {
  activeTab: SessionDashboardTab;
  tabs: {
    history: {
      label: string;
      href: Route;
      content: ReactNode;
    };
    requests: {
      label: string;
      href: Route;
      content: ReactNode;
    };
    availability: {
      label: string;
      href: Route;
      content: ReactNode;
    };
  };
};

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </CardContent>
    </Card>
  );
}

export function SessionDashboardTabs({ activeTab, tabs }: SessionDashboardTabsProps) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(activeTab);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  function handleTabChange(nextTab: string) {
    if (!sessionTabs.includes(nextTab as SessionDashboardTab)) {
      return;
    }

    const tab = nextTab as SessionDashboardTab;
    setSelectedTab(tab);
    startTransition(() => {
      router.push(tabs[tab].href);
    });
  }

  return (
    <Tabs value={selectedTab} className="grid gap-4">
      <TabsList className="h-auto w-full justify-start overflow-x-auto">
        {sessionTabs.map((tab) => (
          <TabsTrigger key={tab} value={tab} asChild>
            <Link
              href={tabs[tab].href}
              onClick={(event) => {
                if (tab === selectedTab) {
                  return;
                }

                event.preventDefault();
                handleTabChange(tab);
              }}
            >
              {tabs[tab].label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
      {sessionTabs.map((tab) => (
        <TabsContent key={tab} value={tab} className="mt-0">
          {isPending && selectedTab === tab && activeTab !== tab ? <LoadingSkeleton /> : tabs[tab].content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
