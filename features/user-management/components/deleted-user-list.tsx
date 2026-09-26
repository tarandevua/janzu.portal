"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";
import { RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { restoreDeletedUserInline } from "@/features/user-management/actions";
import type { UserManagementDictionary } from "@/features/user-management/components/user-role-management-table";
import type { Locale } from "@/lib/i18n/config";
import type { DeletedManagedUser } from "@/server/models/rbac.model";

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}

function RestoreUserButton({
  locale,
  userId,
  dictionary,
}: {
  locale: Locale;
  userId: string;
  dictionary: UserManagementDictionary;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRestore() {
    const formData = new FormData();
    formData.set("userId", userId);
    const toastId = toast.loading(dictionary.restoringUser);

    startTransition(() => {
      void restoreDeletedUserInline(locale, formData)
        .then((result) => {
          if (result.ok) {
            toast.success(dictionary.userRestored, { id: toastId });
            router.refresh();
            return;
          }

          const message = result.status === "restore-forbidden"
            ? dictionary.userRestoreForbidden
            : result.status === "restore-invalid"
              ? dictionary.userRestoreInvalid
              : dictionary.userRestoreFailed;
          toast.error(message, { id: toastId });
        })
        .catch(() => {
          toast.error(dictionary.userRestoreFailed, { id: toastId });
        });
    });
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleRestore}>
      <RotateCcwIcon className="h-4 w-4" />
      {isPending ? dictionary.restoringUser : dictionary.restoreUser}
    </Button>
  );
}

export function DeletedUserList({
  locale,
  users,
  page,
  pageSize,
  totalCount,
  search,
  previousHref,
  nextHref,
  dictionary,
}: {
  locale: Locale;
  users: DeletedManagedUser[];
  page: number;
  pageSize: number;
  totalCount: number;
  search?: string;
  previousHref: string;
  nextHref: string;
  dictionary: UserManagementDictionary;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = formData.get("q");
    const params = new URLSearchParams({ view: "deleted" });

    if (typeof value === "string" && value.trim()) {
      params.set("q", value.trim());
    }

    startTransition(() => {
      router.push(`/${locale}/dashboard/users?${params.toString()}` as Route);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.deletedUsers}</CardTitle>
        <CardDescription>{dictionary.deletedUsersDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="deleted-user-search">{dictionary.search}</Label>
            <Input
              id="deleted-user-search"
              name="q"
              defaultValue={search ?? ""}
              placeholder={dictionary.searchPlaceholder}
            />
          </div>
          <Button type="submit" disabled={isPending}>{dictionary.applyFilters}</Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/${locale}/dashboard/users?view=deleted`}>{dictionary.clearFilters}</Link>
          </Button>
        </form>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.user}</TableHead>
                  <TableHead>{dictionary.deletedAt}</TableHead>
                  <TableHead>{dictionary.deletedBy}</TableHead>
                  <TableHead className="text-right">{dictionary.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div className="font-medium">{user.fullName ?? user.email}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>{formatDate(locale, user.deletedAt)}</TableCell>
                    <TableCell>
                      {user.deletedByFullName ?? user.deletedByEmail ?? dictionary.systemActor}
                    </TableCell>
                    <TableCell className="text-right">
                      <RestoreUserButton
                        locale={locale}
                        userId={user.userId}
                        dictionary={dictionary}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  {dictionary.page} {page} / {totalPages}
                </span>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      {page <= 1 ? (
                        <PaginationPrevious aria-disabled="true" className="pointer-events-none opacity-50">
                          {dictionary.previous}
                        </PaginationPrevious>
                      ) : (
                        <PaginationPrevious href={previousHref as Route}>
                          {dictionary.previous}
                        </PaginationPrevious>
                      )}
                    </PaginationItem>
                    <PaginationItem>
                      {page >= totalPages ? (
                        <PaginationNext aria-disabled="true" className="pointer-events-none opacity-50">
                          {dictionary.next}
                        </PaginationNext>
                      ) : (
                        <PaginationNext href={nextHref as Route}>{dictionary.next}</PaginationNext>
                      )}
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
