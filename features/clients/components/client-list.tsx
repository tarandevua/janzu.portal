"use client";

import React, { useEffect, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";
import type { Client, ClientOutreachPage } from "@/server/models/client.model";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientEditDrawer } from "@/features/clients/components/client-edit-drawer";
import {
  ClientOutreachDrawer,
  type ClientOutreachCopy,
} from "@/features/clients/components/client-outreach-workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ClientListProps = {
  clients: Client[];
  locale: Locale;
  status?: string;
  editingClientId?: string;
  page: number;
  pageSize: number;
  totalCount: number;
  previousHref: string;
  nextHref: string;
  closeHref: string;
  today: string;
  selectedOutreach?: { client: Client; outreach: ClientOutreachPage; page: number } | null;
  dictionary: ClientOutreachCopy & {
    listTitle: string;
    listDescription: string;
    empty: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    notes: string;
    private: string;
    actions: string;
    edit: string;
    editFormTitle: string;
    editFormDescription: string;
    formTitle: string;
    formDescription: string;
    create: string;
    update: string;
    created: string;
    updated: string;
    invalid: string;
    editInvalid: string;
    cancel: string;
    close: string;
    previous: string;
    next: string;
    page: string;
    lifecycleStatus: string;
    statusLabels: Record<"prospect" | "active" | "inactive", string>;
    nextFollowUp: string;
    noFollowUp: string;
    manage: string;
    dueOverdue: string;
    dueToday: string;
    dueUpcoming: string;
  };
};

function ClientTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton className="h-4 w-36" /></TableCell>
              <TableCell><Skeleton className="h-4 w-44" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell className="text-right"><Skeleton className="ml-auto h-9 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ClientList({
  clients,
  locale,
  status,
  editingClientId,
  page,
  pageSize,
  totalCount,
  previousHref,
  nextHref,
  closeHref,
  today,
  selectedOutreach,
  dictionary,
}: ClientListProps) {
  const router = useRouter();
  const [isPaginating, setIsPaginating] = useState(false);
  const [openClientId, setOpenClientId] = useState<string | null>(
    selectedOutreach?.client.id ?? null
  );

  const drawerClient = openClientId
    ? clients.find((client) => client.id === openClientId)
      ?? (selectedOutreach?.client.id === openClientId ? selectedOutreach.client : null)
    : null;
  const loadedOutreach = selectedOutreach?.client.id === openClientId
    ? selectedOutreach
    : null;

  useEffect(() => {
    setIsPaginating(false);
  }, [clients, page]);

  useEffect(() => {
    setOpenClientId(selectedOutreach?.client.id ?? null);
  }, [selectedOutreach?.client.id]);

  useEffect(() => {
    if (status === "created") {
      toast.success(dictionary.created);
    }

    if (status === "updated") {
      toast.success(dictionary.updated);
    }

    if (status === "created" || status === "updated") {
      const params = new URLSearchParams();

      if (page > 1) {
        params.set("clientsPage", String(page));
      }

      router.replace(
        `/${locale}/dashboard/clients${params.size ? `?${params.toString()}` : ""}` as Route
      );
    }
  }, [dictionary.created, dictionary.updated, locale, page, router, status]);

  return (
    <TooltipProvider>
      <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{dictionary.listTitle}</CardTitle>
            <CardDescription>{dictionary.listDescription}</CardDescription>
          </div>
          <Badge variant="secondary">{dictionary.private}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
        ) : isPaginating ? (
          <ClientTableSkeleton />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.name}</TableHead>
                  <TableHead>{dictionary.email}</TableHead>
                  <TableHead>{dictionary.phone}</TableHead>
                  <TableHead>{dictionary.lifecycleStatus}</TableHead>
                  <TableHead>{dictionary.nextFollowUp}</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">{dictionary.actions}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const manageHref = `${closeHref}${closeHref.includes("?") ? "&" : "?"}outreachClientId=${client.id}` as Route;
                  return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email ?? ""}</TableCell>
                    <TableCell>{client.phone ?? ""}</TableCell>
                    <TableCell><Badge variant="outline">{dictionary.statusLabels[client.lifecycleStatus]}</Badge></TableCell>
                    <TableCell>
                      {client.nextFollowUp ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${client.nextFollowUp.followUpOn}T00:00:00Z`))}</span>
                          <Badge variant={client.nextFollowUp.followUpOn < today ? "destructive" : "secondary"}>
                            {client.nextFollowUp.followUpOn < today
                              ? dictionary.dueOverdue
                              : client.nextFollowUp.followUpOn === today
                                ? dictionary.dueToday
                                : dictionary.dueUpcoming}
                          </Badge>
                        </div>
                      ) : <span className="text-muted-foreground">{dictionary.noFollowUp}</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <ClientEditDrawer
                        client={client}
                        locale={locale}
                        status={editingClientId === client.id ? status : undefined}
                        shouldOpen={editingClientId === client.id && status === "edit-invalid"}
                        dictionary={dictionary}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild size="icon" variant="ghost">
                            <Link
                              href={manageHref}
                              onClick={() => setOpenClientId(client.id)}
                              onMouseEnter={() => router.prefetch(manageHref)}
                              onFocus={() => router.prefetch(manageHref)}
                            >
                              <MessageSquareText className="h-4 w-4" />
                              <span className="sr-only">{dictionary.manage}</span>
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{dictionary.manage}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );})}
              </TableBody>
            </Table>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              previousHref={previousHref}
              nextHref={nextHref}
              onNavigate={() => setIsPaginating(true)}
              dictionary={dictionary}
            />
          </div>
        )}
      </CardContent>
      {drawerClient ? (
        <ClientOutreachDrawer
          locale={locale}
          client={drawerClient}
          outreach={loadedOutreach?.outreach}
          page={loadedOutreach?.page ?? 1}
          today={today}
          copy={dictionary}
          closeHref={closeHref}
          loading={!loadedOutreach}
          onClose={() => setOpenClientId(null)}
        />
      ) : null}
      </Card>
    </TooltipProvider>
  );
}
