"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, Trash2Icon, XIcon, EditIcon } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";
import type { Client, ClientOutreachPage, ClientOutreachRecord } from "@/server/models/client.model";
import {
  completeFollowUpInline,
  createOutreachInline,
  deleteOutreachInline,
  rescheduleFollowUpInline,
  updateOutreachInline,
  type OutreachActionState,
} from "@/features/clients/actions";
import { ClientEditDrawer } from "@/features/clients/components/client-edit-drawer";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type ClientOutreachCopy = {
  [key: string]: unknown;
  detailTitle: string; profileTitle: string; private: string; edit: string;
  editFormTitle: string; editFormDescription: string; formTitle: string; formDescription: string;
  name: string; email: string; phone: string; country: string; city: string; notes: string;
  lifecycleStatus: string; statusLabels: Record<Client["lifecycleStatus"], string>;
  create: string; update: string; created: string; updated: string; invalid: string; editInvalid: string;
  cancel: string; close: string;
  nextActionTitle: string; noNextAction: string; completeFollowUp: string; reschedule: string; saveDate: string;
  addOutreach: string; editOutreach: string; contactedOn: string; channel: string;
  channelLabels: Record<ClientOutreachRecord["channel"], string>; channelOther: string;
  sessionOffered: string; response: string;
  responseLabels: Record<ClientOutreachRecord["response"], string>; responseOther: string;
  followUpOn: string; timelineTitle: string; timelineDescription: string; emptyTimeline: string;
  outreachCreated: string; outreachUpdated: string; outreachDeleted: string;
  followUpCompleted: string; followUpRescheduled: string; outreachInvalid: string; outreachFailed: string;
  deleteOutreach: string; deletingOutreach: string; deleteConfirm: string; offered: string; notOffered: string; completed: string;
  loadingOutreach: string;
  previous: string; next: string; page: string;
};

const initialState: OutreachActionState = { ok: false, status: "idle", resultId: null };

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}

function OutreachForm({
  locale, clientId, copy, record, onSuccess, today,
}: {
  locale: Locale; clientId: string; copy: ClientOutreachCopy; record?: ClientOutreachRecord;
  onSuccess?: () => void; today: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const handledResultIdRef = useRef<string | null>(null);
  const [channel, setChannel] = useState(record?.channel ?? "phone");
  const [response, setResponse] = useState(record?.response ?? "interested");
  const action = record
    ? updateOutreachInline.bind(null, locale, clientId, record.id)
    : createOutreachInline.bind(null, locale, clientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.resultId || handledResultIdRef.current === state.resultId) return;
    handledResultIdRef.current = state.resultId;

    if (state.ok) {
      toast.success(state.status === "created" ? copy.outreachCreated : copy.outreachUpdated, {
        id: state.resultId,
      });
      if (!record) formRef.current?.reset();
      router.refresh();
      onSuccess?.();
    } else {
      toast.error(state.status === "invalid" ? copy.outreachInvalid : copy.outreachFailed, {
        id: state.resultId,
      });
    }
  }, [
    copy.outreachCreated,
    copy.outreachFailed,
    copy.outreachInvalid,
    copy.outreachUpdated,
    onSuccess,
    record,
    router,
    state.ok,
    state.resultId,
    state.status,
  ]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`contacted-${record?.id ?? "new"}`}>{copy.contactedOn}</Label>
          <Input id={`contacted-${record?.id ?? "new"}`} name="contactedOn" type="date" required defaultValue={record?.contactedOn ?? today} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`channel-${record?.id ?? "new"}`}>{copy.channel}</Label>
          <select id={`channel-${record?.id ?? "new"}`} name="channel" value={channel} onChange={(event) => setChannel(event.target.value as ClientOutreachRecord["channel"])} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            {Object.entries(copy.channelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      {channel === "other" ? <div className="grid gap-2"><Label htmlFor={`channel-other-${record?.id ?? "new"}`}>{copy.channelOther}</Label><Input id={`channel-other-${record?.id ?? "new"}`} name="channelOther" required defaultValue={record?.channelOther ?? ""} /></div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`response-${record?.id ?? "new"}`}>{copy.response}</Label>
          <select id={`response-${record?.id ?? "new"}`} name="response" value={response} onChange={(event) => setResponse(event.target.value as ClientOutreachRecord["response"])} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            {Object.entries(copy.responseLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`follow-up-${record?.id ?? "new"}`}>{copy.followUpOn}</Label>
          <Input id={`follow-up-${record?.id ?? "new"}`} name="followUpOn" type="date" defaultValue={record?.followUpStatus === "open" ? record.followUpOn ?? "" : ""} disabled={record?.followUpStatus === "completed"} />
        </div>
      </div>
      {response === "other" ? <div className="grid gap-2"><Label htmlFor={`response-other-${record?.id ?? "new"}`}>{copy.responseOther}</Label><Input id={`response-other-${record?.id ?? "new"}`} name="responseOther" required defaultValue={record?.responseOther ?? ""} /></div> : null}
      <label className="flex items-center gap-2 text-sm"><input name="sessionOffered" type="checkbox" defaultChecked={record?.sessionOffered ?? false} />{copy.sessionOffered}</label>
      <div className="grid gap-2"><Label htmlFor={`outreach-notes-${record?.id ?? "new"}`}>{copy.notes}</Label><Textarea id={`outreach-notes-${record?.id ?? "new"}`} name="notes" rows={4} defaultValue={record?.notes ?? ""} /></div>
      <Button className="w-fit" disabled={pending}>{record ? copy.update : copy.addOutreach}</Button>
    </form>
  );
}

function NextAction({ locale, client, copy }: { locale: Locale; client: Client; copy: ClientOutreachCopy }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const action = client.nextFollowUp;
  const [date, setDate] = useState(action?.followUpOn ?? "");
  const complete = () => startTransition(async () => {
    if (!action) return;
    const result = await completeFollowUpInline(locale, client.id, action.recordId);
    toast[result.ok ? "success" : "error"](result.ok ? copy.followUpCompleted : copy.outreachFailed);
    if (result.ok) router.refresh();
  });

  function reschedule() {
    if (!action || !date) return;
    startTransition(async () => {
      const formData = new FormData(); formData.set("followUpOn", date);
      const result = await rescheduleFollowUpInline(locale, client.id, action.recordId, formData);
      toast[result.ok ? "success" : "error"](result.ok ? copy.followUpRescheduled : copy.outreachFailed);
      if (result.ok) router.refresh();
    });
  }

  return <Card><CardHeader><CardTitle>{copy.nextActionTitle}</CardTitle></CardHeader><CardContent>
    {!action ? <p className="text-sm text-muted-foreground">{copy.noNextAction}</p> : <div className="flex flex-wrap items-end gap-3">
      <div className="grid gap-2"><Label htmlFor="reschedule-date">{copy.followUpOn}</Label><Input id="reschedule-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
      <Button variant="outline" disabled={pending || !date} onClick={reschedule}>{copy.saveDate}</Button>
      <Button disabled={pending} onClick={complete}>{copy.completeFollowUp}</Button>
    </div>}
  </CardContent></Card>;
}

function DeleteOutreachDialog({ locale, clientId, recordId, copy }: {
  locale: Locale;
  clientId: string;
  recordId: string;
  copy: ClientOutreachCopy;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteOutreachInline(locale, clientId, recordId);
      toast[result.ok ? "success" : "error"](result.ok ? copy.outreachDeleted : copy.outreachFailed);

      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="destructive">
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.deleteOutreach}</DialogTitle>
          <DialogDescription>{copy.deleteConfirm}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              {copy.cancel}
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" disabled={pending} onClick={remove}>
            <Trash2Icon className="h-4 w-4" />
            {pending ? copy.deletingOutreach : copy.deleteOutreach}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OutreachRecordDialog({ locale, clientId, record, copy, today, trigger, tooltip }: {
  locale: Locale;
  clientId: string;
  record?: ClientOutreachRecord;
  copy: ClientOutreachCopy;
  today: string;
  trigger: ReactElement;
  tooltip?: string;
}) {
  const [open, setOpen] = useState(false);
  const title = record ? copy.editOutreach : copy.addOutreach;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      ) : <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {record ? formatDate(locale, record.contactedOn) : copy.timelineDescription}
          </DialogDescription>
        </DialogHeader>
        <OutreachForm
          locale={locale}
          clientId={clientId}
          copy={copy}
          record={record}
          today={today}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function ClientOutreachWorkspace({ locale, client, outreach, page, today, copy, closeHref }: {
  locale: Locale; client: Client; outreach: ClientOutreachPage; page: number; today: string; copy: ClientOutreachCopy;
  closeHref: string;
}) {
  const pageSize = 20;
  const href = (nextPage: number) => `${closeHref}${closeHref.includes("?") ? "&" : "?"}outreachClientId=${client.id}&outreachPage=${nextPage}`;

  return <div className="grid gap-4">
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><div className="flex items-start justify-between gap-3"><div className="flex justify-between gap-2"><div><CardTitle>{copy.profileTitle}</CardTitle><CardDescription>{client.name}</CardDescription></div><ClientEditDrawer client={client} locale={locale} dictionary={copy} /></div><Badge>{copy.statusLabels[client.lifecycleStatus]}</Badge></div></CardHeader><CardContent className="grid gap-3 text-sm">
        <p>{client.email ?? "—"}</p><p>{client.phone ?? "—"}</p><p>{[client.city, client.country].filter(Boolean).join(", ") || "—"}</p>{client.notes ? <p className="whitespace-pre-wrap text-muted-foreground">{client.notes}</p> : null}

      </CardContent></Card>
      <NextAction locale={locale} client={client} copy={copy} />
    </div>
    <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{copy.timelineTitle}</CardTitle><CardDescription>{copy.timelineDescription}</CardDescription></div><OutreachRecordDialog locale={locale} clientId={client.id} copy={copy} today={today} trigger={<Button type="button" size="sm"><PlusIcon className="h-4 w-4" />{copy.addOutreach}</Button>} /></div></CardHeader><CardContent>
      {outreach.items.length === 0 ? <p className="text-sm text-muted-foreground">{copy.emptyTimeline}</p> : <div className="grid gap-4">
        {outreach.items.map((record) => <article key={record.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{formatDate(locale, record.contactedOn)} · {record.channel === "other" ? record.channelOther : copy.channelLabels[record.channel]}</p><p className="text-sm text-muted-foreground">{record.response === "other" ? record.responseOther : copy.responseLabels[record.response]} · {record.sessionOffered ? copy.offered : copy.notOffered}</p></div><div className="flex gap-2">
          <OutreachRecordDialog locale={locale} clientId={client.id} record={record} copy={copy} today={today} trigger={<Button type="button" size="sm" variant="outline"><EditIcon className="h-4 w-4" /></Button>} />
          <DeleteOutreachDialog locale={locale} clientId={client.id} recordId={record.id} copy={copy} />
        </div></div>{record.notes ? <p className="mt-3 whitespace-pre-wrap text-sm">{record.notes}</p> : null}{record.followUpOn ? <p className="mt-3 text-sm"><strong>{copy.followUpOn}:</strong> {formatDate(locale, record.followUpOn)} {record.followUpStatus === "completed" ? `· ${copy.completed}` : ""}</p> : null}</article>)}
        <PaginationControls page={page} pageSize={pageSize} totalCount={outreach.totalCount} previousHref={href(page - 1)} nextHref={href(page + 1)} dictionary={copy} />
      </div>}
    </CardContent></Card>
  </div>;
}

export function ClientOutreachDrawer({
  locale,
  client,
  outreach,
  page,
  today,
  copy,
  closeHref,
  loading = false,
  onClose,
}: {
  locale: Locale;
  client: Client;
  outreach?: ClientOutreachPage;
  page: number;
  today: string;
  copy: ClientOutreachCopy;
  closeHref: string;
  loading?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();

  return (
    <Drawer
      direction="right"
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
          router.replace(closeHref as never);
        }
      }}
      handleOnly
    >
      <DrawerContent className="inset-x-auto bottom-0 left-auto right-0 top-0 mt-0 flex h-[100dvh] max-h-[100dvh] w-[min(100vw,52rem)] max-w-[100vw] overflow-hidden rounded-none border-l">
        <DrawerHeader className="relative shrink-0 border-b pr-14 text-left">
          <DrawerTitle>{copy.detailTitle}: {client.name}</DrawerTitle>
          <DrawerDescription>{copy.timelineDescription}</DrawerDescription>
          <DrawerClose asChild>
            <Button type="button" size="icon" variant="ghost" className="absolute right-3 top-3 h-8 w-8">
              <XIcon className="h-4 w-4" />
              <span className="sr-only">{copy.close}</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
          {loading || !outreach ? (
            <ClientOutreachDrawerSkeleton label={copy.loadingOutreach} />
          ) : (
            <ClientOutreachWorkspace
              locale={locale}
              client={client}
              outreach={outreach}
              page={page}
              today={today}
              copy={copy}
              closeHref={closeHref}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ClientOutreachDrawerSkeleton({ label }: { label: string }) {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label={label}>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="grid gap-4 rounded-lg border p-5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-56 max-w-full" />
            <Skeleton className="h-4 w-44 max-w-full" />
            <Skeleton className="h-9 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 rounded-lg border p-5">
        <Skeleton className="h-5 w-44" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-4 rounded-lg border p-5">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="grid gap-3 rounded-lg border p-4">
            <Skeleton className="h-4 w-52 max-w-full" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
