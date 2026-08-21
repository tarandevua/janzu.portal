"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState, useTransition, type FormEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, MailIcon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  assignUserRole,
  removeUserRole,
  resendUserInvite,
  updateUserPublicProfile,
} from "@/features/user-management/actions";
import type { Locale } from "@/lib/i18n/config";
import { roles, type ManagedUser, type ManagedUserFilters, type Role } from "@/server/models/rbac.model";
import { canManageUserRole } from "@/server/services/rbac.service";

type UserManagementDictionary = {
  title: string;
  description: string;
  user: string;
  fullName: string;
  email: string;
  roles: string;
  created: string;
  assignRole: string;
  removeRole: string;
  viewDetails: string;
  cancel: string;
  close: string;
  detailsTitle: string;
  detailsDescription: string;
  resendInvite: string;
  resendSending: string;
  userId: string;
  practitionerProfile: string;
  profileStatus: string;
  managePublicProfile: string;
  savePublicProfile: string;
  publicProfile: string;
  privateProfile: string;
  noProfile: string;
  notAvailable: string;
  location: string;
  languages: string;
  activitySummary: string;
  clientsCount: string;
  sessionsCount: string;
  validatedSessionsCount: string;
  sessionRequestsCount: string;
  submittedLocationsCount: string;
  approvedLocationsCount: string;
  eventRsvpsCount: string;
  filters: string;
  search: string;
  searchPlaceholder: string;
  filterRole: string;
  allRoles: string;
  filterProfile: string;
  allProfiles: string;
  withProfile: string;
  withoutProfile: string;
  applyFilters: string;
  clearFilters: string;
  previous: string;
  next: string;
  page: string;
  action: string;
  empty: string;
  assigned: string;
  removed: string;
  resent: string;
  resendFailed: string;
  resendNotEligible: string;
  resendEmailNotConfigured: string;
  resendProviderUnavailable: string;
  resendProviderRejected: string;
  resendLinkFailed: string;
  publicProfileUpdated: string;
  publicProfileInvalid: string;
  invalid: string;
  forbidden: string;
  roleLabels: Record<Role, string>;
};

type UserRoleManagementTableProps = {
  locale: Locale;
  users: ManagedUser[];
  actorRoles: Role[];
  status?: string;
  page: number;
  pageSize: number;
  totalCount: number;
  filters: ManagedUserFilters;
  resetHref: string;
  previousHref: string;
  nextHref: string;
  dictionary: UserManagementDictionary;
};

function formatCreatedAt(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatList(values: string[], fallback: string) {
  return values.length > 0 ? values.join(", ") : fallback;
}

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid gap-1 rounded-md border p-3">
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

function ResendInviteButton({
  locale,
  userId,
  dictionary,
}: {
  locale: Locale;
  userId: string;
  dictionary: UserManagementDictionary;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const toastId = toast.loading(dictionary.resendSending);

    startTransition(() => {
      void resendUserInvite(locale, formData)
        .then((result) => {
          if (result.ok) {
            toast.success(dictionary.resent, { id: toastId });
            return;
          }

          const message = {
            invalid: dictionary.resendFailed,
            "not-eligible": dictionary.resendNotEligible,
            "email-not-configured": dictionary.resendEmailNotConfigured,
            "provider-unavailable": dictionary.resendProviderUnavailable,
            "provider-rejected": dictionary.resendProviderRejected,
            "link-generation-failed": dictionary.resendLinkFailed,
            error: dictionary.resendFailed,
          }[result.status];

          toast.error(message, { id: toastId });
        })
        .catch(() => {
          toast.error(dictionary.resendFailed, { id: toastId });
        });
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" variant="outline" disabled={isPending}>
        <MailIcon className="h-4 w-4" />
        {isPending ? dictionary.resendSending : dictionary.resendInvite}
      </Button>
    </form>
  );
}

function UserManagementSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead className="w-40">
              <Skeleton className="h-4 w-16" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="grid gap-2">
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="w-40">
                <Skeleton className="h-9 w-28" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between border-t px-4 py-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-44" />
      </div>
    </div>
  );
}

function UserDetailsDrawer({
  locale,
  managedUser,
  actorRoles,
  assignableRoles,
  dictionary,
}: {
  locale: Locale;
  managedUser: ManagedUser;
  actorRoles: Role[];
  assignableRoles: Role[];
  dictionary: UserManagementDictionary;
}) {
  const assignAction = assignUserRole.bind(null, locale);
  const removeAction = removeUserRole.bind(null, locale);
  const publicProfileAction = updateUserPublicProfile.bind(null, locale);
  const displayName = managedUser.fullName ?? managedUser.email;
  const profileStatus = managedUser.practitionerId
    ? managedUser.practitionerIsPublic
      ? dictionary.publicProfile
      : dictionary.privateProfile
    : dictionary.noProfile;
  const location = [managedUser.practitionerCountry, managedUser.practitionerCity]
    .filter(Boolean)
    .join(", ");

  return (
    <Drawer direction="right" handleOnly>
      <DrawerTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <EyeIcon className="h-4 w-4" />
          {dictionary.viewDetails}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="inset-x-auto bottom-0 left-auto right-0 top-0 mt-0 flex h-[100dvh] max-h-[100dvh] w-[min(100vw,40rem)] max-w-[100vw] overflow-hidden rounded-none border-l">
        <DrawerHeader className="relative shrink-0 border-b pr-14 text-left">
          <DrawerTitle>{dictionary.detailsTitle}</DrawerTitle>
          <DrawerDescription>{dictionary.detailsDescription}</DrawerDescription>
          <DrawerClose asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-3 top-3 h-8 w-8"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">{dictionary.close}</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
          <div className="grid gap-6">
            <section className="grid gap-3">
              <h3 className="text-sm font-semibold">{dictionary.user}</h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailItem label={dictionary.fullName} value={displayName} />
                <DetailItem label={dictionary.email} value={managedUser.email} />
                <DetailItem label={dictionary.userId} value={managedUser.userId} />
                <DetailItem
                  label={dictionary.created}
                  value={formatCreatedAt(locale, managedUser.createdAt)}
                />
              </dl>
              <div className="flex flex-wrap gap-2">
                {managedUser.roles.map((role) => (
                  <form key={role} action={removeAction}>
                    <input type="hidden" name="userId" value={managedUser.userId} />
                    <input type="hidden" name="role" value={role} />
                    <Badge
                      variant={canManageUserRole(actorRoles, role) ? "secondary" : "outline"}
                      className="gap-1"
                    >
                    {dictionary.roleLabels[role]}
                      {canManageUserRole(actorRoles, role) ? (
                        <button
                          type="submit"
                          className="ml-1 inline-flex rounded-sm opacity-80 hover:opacity-100"
                          aria-label={`${dictionary.removeRole} ${dictionary.roleLabels[role]}`}
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      ) : null}
                    </Badge>
                  </form>
                ))}
              </div>
              <form action={assignAction} className="flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="userId" value={managedUser.userId} />
                <Select name="role">
                  <SelectTrigger aria-label={dictionary.assignRole}>
                    <SelectValue placeholder={dictionary.assignRole} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {dictionary.roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" variant="outline">
                  <PlusIcon className="h-4 w-4" />
                  {dictionary.assignRole}
                </Button>
              </form>
              {managedUser.canResendInvite ? (
                <ResendInviteButton
                  locale={locale}
                  userId={managedUser.userId}
                  dictionary={dictionary}
                />
              ) : null}
            </section>

            <section className="grid gap-3">
              <h3 className="text-sm font-semibold">{dictionary.practitionerProfile}</h3>
              {managedUser.practitionerId ? (
                <form action={publicProfileAction} className="grid gap-3 rounded-md border p-3">
                  <input type="hidden" name="userId" value={managedUser.userId} />
                  <div className="grid gap-2">
                    <label htmlFor={`isPublic-${managedUser.userId}`} className="text-sm font-medium">
                      {dictionary.managePublicProfile}
                    </label>
                    <Select
                      name="isPublic"
                      defaultValue={managedUser.practitionerIsPublic ? "true" : "false"}
                    >
                      <SelectTrigger id={`isPublic-${managedUser.userId}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">{dictionary.publicProfile}</SelectItem>
                        <SelectItem value="false">{dictionary.privateProfile}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" size="sm" className="w-fit">
                    {dictionary.savePublicProfile}
                  </Button>
                </form>
              ) : null}
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailItem label={dictionary.profileStatus} value={profileStatus} />
                <DetailItem label={dictionary.location} value={location || dictionary.notAvailable} />
                <DetailItem
                  label={dictionary.languages}
                  value={formatList(managedUser.practitionerLanguages, dictionary.notAvailable)}
                />
                <DetailItem
                  label={dictionary.approvedLocationsCount}
                  value={managedUser.approvedLocationsCount}
                />
              </dl>
            </section>

            <section className="grid gap-3">
              <h3 className="text-sm font-semibold">{dictionary.activitySummary}</h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailItem label={dictionary.clientsCount} value={managedUser.clientsCount} />
                <DetailItem label={dictionary.sessionsCount} value={managedUser.sessionsCount} />
                <DetailItem
                  label={dictionary.validatedSessionsCount}
                  value={managedUser.validatedSessionsCount}
                />
                <DetailItem
                  label={dictionary.sessionRequestsCount}
                  value={managedUser.sessionRequestsCount}
                />
                <DetailItem
                  label={dictionary.submittedLocationsCount}
                  value={managedUser.submittedLocationsCount}
                />
                <DetailItem label={dictionary.eventRsvpsCount} value={managedUser.eventRsvpsCount} />
              </dl>
            </section>
          </div>
        </div>
        <DrawerFooter className="shrink-0 border-t bg-background">
          <DrawerClose asChild>
            <Button type="button" variant="outline" className="w-full">
              {dictionary.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function UserRoleManagementTable({
  locale,
  users,
  actorRoles,
  status,
  page,
  pageSize,
  totalCount,
  filters,
  resetHref,
  previousHref,
  nextHref,
  dictionary,
}: UserRoleManagementTableProps) {
  const router = useRouter();
  const assignableRoles = roles.filter((role) => canManageUserRole(actorRoles, role));
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
  const [isPending, startTransition] = useTransition();
  const [isShowingSkeleton, setIsShowingSkeleton] = useState(false);
  const isLoading = isPending || isShowingSkeleton;

  useEffect(() => {
    setIsShowingSkeleton(false);
  }, [users, page, filters.search, filters.role, filters.profile]);

  function navigateWithSkeleton(href: string) {
    setIsShowingSkeleton(true);
    startTransition(() => {
      router.push(href as Route);
    });
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const search = formData.get("q");
    const role = formData.get("role");
    const profile = formData.get("profile");

    if (typeof search === "string" && search.trim()) {
      params.set("q", search.trim());
    }

    if (typeof role === "string" && role !== "all") {
      params.set("role", role);
    }

    if (typeof profile === "string" && profile !== "all") {
      params.set("profile", profile);
    }

    const query = params.toString();
    navigateWithSkeleton(`/${locale}/dashboard/users${query ? `?${query}` : ""}`);
  }

  function handleNavigationClick(href: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigateWithSkeleton(href);
    };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFilterSubmit} className="mb-4 grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_12rem_13rem_auto_auto] md:items-end">
          <input type="hidden" name="usersPage" value="1" />
          <div className="grid gap-2">
            <Label htmlFor="user-search">{dictionary.search}</Label>
            <Input
              id="user-search"
              name="q"
              defaultValue={filters.search ?? ""}
              placeholder={dictionary.searchPlaceholder}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role-filter">{dictionary.filterRole}</Label>
            <Select name="role" defaultValue={filters.role ?? "all"}>
              <SelectTrigger id="role-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dictionary.allRoles}</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {dictionary.roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-filter">{dictionary.filterProfile}</Label>
            <Select name="profile" defaultValue={filters.profile ?? "all"}>
              <SelectTrigger id="profile-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dictionary.allProfiles}</SelectItem>
                <SelectItem value="with_profile">{dictionary.withProfile}</SelectItem>
                <SelectItem value="without_profile">{dictionary.withoutProfile}</SelectItem>
                <SelectItem value="public_profile">{dictionary.publicProfile}</SelectItem>
                <SelectItem value="private_profile">{dictionary.privateProfile}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">{dictionary.applyFilters}</Button>
          <Button type="button" variant="outline" asChild>
            <Link href={resetHref as Route} onClick={handleNavigationClick(resetHref)}>
              {dictionary.clearFilters}
            </Link>
          </Button>
        </form>
        {status === "assigned" ? (
          <p className="mb-4 text-sm font-medium text-emerald-700">{dictionary.assigned}</p>
        ) : null}
        {status === "removed" ? (
          <p className="mb-4 text-sm font-medium text-emerald-700">{dictionary.removed}</p>
        ) : null}
        {status === "public-profile-updated" ? (
          <p className="mb-4 text-sm font-medium text-emerald-700">{dictionary.publicProfileUpdated}</p>
        ) : null}
        {status === "public-profile-invalid" ? (
          <p className="mb-4 text-sm font-medium text-destructive">{dictionary.publicProfileInvalid}</p>
        ) : null}
        {status === "invalid" ? (
          <p className="mb-4 text-sm font-medium text-destructive">{dictionary.invalid}</p>
        ) : null}
        {status === "forbidden" ? (
          <p className="mb-4 text-sm font-medium text-destructive">{dictionary.forbidden}</p>
        ) : null}
        {isLoading ? (
          <UserManagementSkeleton />
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.user}</TableHead>
                  <TableHead>{dictionary.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((managedUser) => (
                  <TableRow key={managedUser.userId}>
                    <TableCell>
                      <div className="grid gap-2">
                        <div className="font-medium">{managedUser.fullName ?? managedUser.email}</div>
                        <div className="flex flex-wrap gap-2">
                        {managedUser.roles.map((role) => (
                          <Badge key={role} variant="outline">
                            {dictionary.roleLabels[role]}
                          </Badge>
                        ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="flex flex-wrap gap-2">
                        <UserDetailsDrawer
                          locale={locale}
                          managedUser={managedUser}
                          actorRoles={actorRoles}
                          assignableRoles={assignableRoles}
                          dictionary={dictionary}
                        />
                      </div>
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
                        <PaginationPrevious
                          aria-disabled="true"
                          className="pointer-events-none opacity-50"
                        >
                          {dictionary.previous}
                        </PaginationPrevious>
                      ) : (
                        <PaginationPrevious asChild>
                          <Link
                            href={previousHref as Route}
                            onClick={handleNavigationClick(previousHref)}
                          >
                            {dictionary.previous}
                          </Link>
                        </PaginationPrevious>
                      )}
                    </PaginationItem>
                    <PaginationItem>
                      {page >= totalPages ? (
                        <PaginationNext
                          aria-disabled="true"
                          className="pointer-events-none opacity-50"
                        >
                          {dictionary.next}
                        </PaginationNext>
                      ) : (
                        <PaginationNext asChild>
                          <Link href={nextHref as Route} onClick={handleNavigationClick(nextHref)}>
                            {dictionary.next}
                          </Link>
                        </PaginationNext>
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
