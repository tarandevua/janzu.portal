"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardNavigationLoadingContextValue = {
  isLoading: boolean;
  skeletonVariant: DashboardSkeletonVariant;
  startNavigation: (href: string) => void;
};

const DashboardNavigationLoadingContext =
  createContext<DashboardNavigationLoadingContextValue | null>(null);

function normalizePath(href: string) {
  try {
    return new URL(href, window.location.origin).pathname;
  } catch {
    return href;
  }
}

type DashboardSkeletonVariant = "generic" | "practitioner" | "apprentice" | "knowledge";

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full max-w-44" />
      </CardContent>
    </Card>
  );
}

function TableCardSkeleton({
  rows = 4,
  columns = 2,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-9 w-20" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-24" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-3 border-t pt-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={columnIndex === 0 ? "h-4 w-28" : "h-4 w-full max-w-40"}
              />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PractitionerDashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <TableCardSkeleton columns={2} />
          <TableCardSkeleton columns={3} />
        </div>
        <TableCardSkeleton rows={5} columns={3} />
      </div>
    </div>
  );
}

function ApprenticeDashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <Skeleton className="h-9 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-44" />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <TableCardSkeleton columns={2} />
          <TableCardSkeleton columns={3} />
        </div>
        <TableCardSkeleton rows={4} columns={2} />
      </div>
    </div>
  );
}

export function KnowledgeBaseSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] p-4 md:p-6">
      <div className="grid gap-8 xl:grid-cols-[240px_minmax(0,1fr)_200px]">
        <div className="hidden xl:block" aria-hidden="true" />

        <main className="min-w-0">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-10 w-full max-w-xl" />
          <Skeleton className="mt-4 h-6 w-full max-w-2xl" />
          <div className="my-8 border-t" />
          <div className="space-y-7">
            {Array.from({ length: 3 }).map((_, sectionIndex) => (
              <section key={sectionIndex} className="space-y-3">
                <Skeleton className="h-7 w-2/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </section>
            ))}
          </div>
          <div className="mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </main>

        <div className="hidden xl:block" aria-hidden="true" />
      </div>
    </div>
  );
}

function DashboardPageSkeleton({ variant }: { variant: DashboardSkeletonVariant }) {
  if (variant === "practitioner") {
    return <PractitionerDashboardSkeleton />;
  }

  if (variant === "apprentice") {
    return <ApprenticeDashboardSkeleton />;
  }

  if (variant === "knowledge") {
    return <KnowledgeBaseSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full max-w-44" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-10 w-2/3" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DashboardNavigationLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [skeletonVariant, setSkeletonVariant] = useState<DashboardSkeletonVariant>("generic");
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    setIsLoading(false);
    setSkeletonVariant("generic");
  }, [routeKey]);

  const startNavigation = useCallback(
    (href: string) => {
      const nextPath = normalizePath(href);

      if (nextPath.includes("/dashboard/knowledge-base")) {
        setSkeletonVariant("knowledge");
        setIsLoading(true);
        return;
      }

      if (nextPath !== pathname) {
        if (nextPath.endsWith("/dashboard/practitioner")) {
          setSkeletonVariant("practitioner");
        } else if (nextPath.endsWith("/dashboard/apprentice")) {
          setSkeletonVariant("apprentice");
        } else {
          setSkeletonVariant("generic");
        }
        setIsLoading(true);
      }
    },
    [pathname]
  );

  const value = useMemo(
    () => ({ isLoading, skeletonVariant, startNavigation }),
    [isLoading, skeletonVariant, startNavigation]
  );

  return (
    <DashboardNavigationLoadingContext.Provider value={value}>
      {children}
    </DashboardNavigationLoadingContext.Provider>
  );
}

export function DashboardNavigationContent({ children }: { children: ReactNode }) {
  const navigationLoading = useContext(DashboardNavigationLoadingContext);

  return navigationLoading?.isLoading ? (
    <DashboardPageSkeleton variant={navigationLoading.skeletonVariant} />
  ) : children;
}

export function useDashboardNavigationLoading() {
  return useContext(DashboardNavigationLoadingContext);
}
