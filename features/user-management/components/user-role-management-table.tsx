import Link from "next/link";
import type { Route } from "next";
import { EyeIcon, PlusIcon, XIcon } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  assignUserRole,
  removeUserRole,
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
  detailsTitle: string;
  detailsDescription: string;
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

function UserDetailsSheet({
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
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <EyeIcon className="h-4 w-4" />
          {dictionary.viewDetails}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full w-full max-w-[100vw] flex-col overflow-hidden sm:max-w-xl">
        <SheetHeader className="shrink-0 pr-8">
          <SheetTitle>{dictionary.detailsTitle}</SheetTitle>
          <SheetDescription>{dictionary.detailsDescription}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-4">
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
      </SheetContent>
    </Sheet>
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
  const assignableRoles = roles.filter((role) => canManageUserRole(actorRoles, role));
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form method="get" className="mb-4 grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_12rem_13rem_auto_auto] md:items-end">
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
            <Link href={resetHref as Route}>{dictionary.clearFilters}</Link>
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
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.user}</TableHead>
                  <TableHead>{dictionary.email}</TableHead>
                  <TableHead>{dictionary.roles}</TableHead>
                  <TableHead>{dictionary.created}</TableHead>
                  <TableHead>{dictionary.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((managedUser) => (
                  <TableRow key={managedUser.userId}>
                    <TableCell className="font-medium">
                      {managedUser.fullName ?? managedUser.email}
                    </TableCell>
                    <TableCell>{managedUser.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {managedUser.roles.map((role) => (
                          <Badge key={role} variant="outline">
                            {dictionary.roleLabels[role]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatCreatedAt(locale, managedUser.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <UserDetailsSheet
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
                          <Link href={previousHref as Route}>{dictionary.previous}</Link>
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
                          <Link href={nextHref as Route}>{dictionary.next}</Link>
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
