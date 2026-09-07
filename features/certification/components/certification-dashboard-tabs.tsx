"use client";

import React, { useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type CertificationDashboardTab =
  | "progress"
  | "reviews"
  | "authorization"
  | "assessments"
  | "certificates";

type CertificationDashboardTabsProps = {
  defaultTab: CertificationDashboardTab;
  sections: Array<{
    id: CertificationDashboardTab;
    label: string;
    content: ReactNode;
  }>;
};

export function CertificationDashboardTabs({
  defaultTab,
  sections,
}: CertificationDashboardTabsProps) {
  const availableDefault = sections.some((section) => section.id === defaultTab)
    ? defaultTab
    : sections[0]?.id;

  if (!availableDefault) return null;

  return (
    <AvailableCertificationDashboardTabs
      activeTab={availableDefault}
      sections={sections}
    />
  );
}

function AvailableCertificationDashboardTabs({
  activeTab,
  sections,
}: {
  activeTab: CertificationDashboardTab;
  sections: CertificationDashboardTabsProps["sections"];
}) {
  const [selectedTab, setSelectedTab] = useState(activeTab);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  return (
    <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as CertificationDashboardTab)} className="grid gap-4">
      <TabsList className="h-auto w-full justify-start overflow-x-auto">
        {sections.map((section) => (
          <TabsTrigger key={section.id} value={section.id}>
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {sections.map((section) => (
        <TabsContent key={section.id} value={section.id} className="mt-0">
          {section.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
