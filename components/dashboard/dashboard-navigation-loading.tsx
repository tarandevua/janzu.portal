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

function DashboardPageSkeleton() {
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
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    setIsLoading(false);
  }, [routeKey]);

  const startNavigation = useCallback(
    (href: string) => {
      const nextPath = normalizePath(href);

      if (nextPath !== pathname) {
        setIsLoading(true);
      }
    },
    [pathname]
  );

  const value = useMemo(() => ({ isLoading, startNavigation }), [isLoading, startNavigation]);

  return (
    <DashboardNavigationLoadingContext.Provider value={value}>
      {children}
    </DashboardNavigationLoadingContext.Provider>
  );
}

export function DashboardNavigationContent({ children }: { children: ReactNode }) {
  const navigationLoading = useContext(DashboardNavigationLoadingContext);

  return navigationLoading?.isLoading ? <DashboardPageSkeleton /> : children;
}

export function useDashboardNavigationLoading() {
  return useContext(DashboardNavigationLoadingContext);
}
