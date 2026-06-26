import Link from "next/link";
import type { Route } from "next";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  previousHref: string;
  nextHref: string;
  dictionary: {
    previous: string;
    next: string;
    page: string;
  };
};

export function PaginationControls({
  page,
  pageSize,
  totalCount,
  previousHref,
  nextHref,
  dictionary,
}: PaginationControlsProps) {
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        {dictionary.page} {page} / {totalPages}
      </span>
      <div className="flex gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeftIcon className="h-4 w-4" />
            {dictionary.previous}
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={previousHref as Route}>
              <ChevronLeftIcon className="h-4 w-4" />
              {dictionary.previous}
            </Link>
          </Button>
        )}
        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled>
            {dictionary.next}
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={nextHref as Route}>
              {dictionary.next}
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
