"use client";

import { useState, useTransition, type FormEvent } from "react";
import { EyeIcon, RotateCcwIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";
import type { LocationPermanentDeleteActionResult, LocationRestoreActionResult } from "@/features/locations/actions";
import {
  permanentlyDeleteLocationInline,
  restoreDeletedLocationInline,
} from "@/features/locations/actions";
import type { LocationWithMedia } from "@/server/models/location.model";
import { reviewLocationSubmission } from "@/features/locations/actions";
import { LocationImageGallery } from "@/features/locations/components/location-image-gallery";
import { formatCoordinate } from "@/features/maps/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LocationPreviewDrawerProps = {
  locale: Locale;
  location: LocationWithMedia;
  mode: "view" | "review" | "deleted";
  onRestore?: (locationId: string) => void;
  onRestoreFailed?: (locationId: string) => void;
  onPermanentDelete?: (locationId: string) => void;
  onPermanentDeleteFailed?: (locationId: string) => void;
  dictionary: {
    view: string;
    review: string;
    close: string;
    cancel: string;
    name: string;
    type: string;
    description: string;
    coordinates: string;
    temperature: string;
    accessInfo: string;
    status: string;
    reviewedBy: string;
    latestReview: string;
    created: string;
    updated: string;
    reason: string;
    approve: string;
    reject: string;
    restore: string;
    restoreSaving: string;
    restored: string;
    restoreInvalid: string;
    restoreForbidden: string;
    deletePermanently: string;
    permanentDeleteTitle: string;
    permanentDeleteDescription: string;
    permanentDeleteInputLabel: string;
    permanentDeleteInputPlaceholder: string;
    permanentDeleteAction: string;
    permanentDeleteSaving: string;
    permanentDeleted: string;
    permanentDeleteInvalid: string;
    permanentDeleteForbidden: string;
    pool: string;
    spa: string;
    naturalWater: string;
    pending: string;
    approved: string;
    rejected: string;
  };
};

function getTypeLabel(
  locationType: LocationWithMedia["locationType"],
  dictionary: LocationPreviewDrawerProps["dictionary"]
) {
  if (locationType === "spa") {
    return dictionary.spa;
  }

  if (locationType === "natural_water") {
    return dictionary.naturalWater;
  }

  return dictionary.pool;
}

function getStatusLabel(
  status: LocationWithMedia["status"],
  dictionary: LocationPreviewDrawerProps["dictionary"]
) {
  if (status === "approved") {
    return dictionary.approved;
  }

  if (status === "rejected") {
    return dictionary.rejected;
  }

  return dictionary.pending;
}

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailItem({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="grid gap-1 rounded-md border p-3">
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium">{value || "-"}</dd>
    </div>
  );
}

export function LocationPreviewDrawer({
  locale,
  location,
  mode,
  onRestore,
  onRestoreFailed,
  onPermanentDelete,
  onPermanentDeleteFailed,
  dictionary,
}: LocationPreviewDrawerProps) {
  const reviewAction = reviewLocationSubmission.bind(null, locale);
  const [isPending, startTransition] = useTransition();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const triggerLabel = mode === "review" ? dictionary.review : dictionary.view;
  const isReviewMode = mode === "review";
  const temperature =
    location.temperatureValue !== null && location.temperatureUnit
      ? `${location.temperatureValue}°${location.temperatureUnit === "celsius" ? "C" : "F"}`
      : null;

  function getRestoreErrorMessage(status: LocationRestoreActionResult["status"]) {
    return status === "restore-forbidden" ? dictionary.restoreForbidden : dictionary.restoreInvalid;
  }

  function getPermanentDeleteErrorMessage(status: LocationPermanentDeleteActionResult["status"]) {
    return status === "permanent-delete-forbidden"
      ? dictionary.permanentDeleteForbidden
      : dictionary.permanentDeleteInvalid;
  }

  function handleRestore() {
    const formData = new FormData();
    formData.set("locationId", location.id);
    onRestore?.(location.id);
    const toastId = toast.loading(dictionary.restoreSaving);

    startTransition(() => {
      void restoreDeletedLocationInline(locale, formData)
        .then((result) => {
          if (result.ok) {
            toast.success(dictionary.restored, { id: toastId });
            return;
          }

          onRestoreFailed?.(location.id);
          toast.error(getRestoreErrorMessage(result.status), { id: toastId });
        })
        .catch(() => {
          onRestoreFailed?.(location.id);
          toast.error(dictionary.restoreInvalid, { id: toastId });
        });
    });
  }

  function handlePermanentDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (deleteConfirmation !== "delete") {
      toast.error(dictionary.permanentDeleteInvalid);
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsDeleteDialogOpen(false);
    setDeleteConfirmation("");
    onPermanentDelete?.(location.id);
    const toastId = toast.loading(dictionary.permanentDeleteSaving);

    startTransition(() => {
      void permanentlyDeleteLocationInline(locale, formData)
        .then((result) => {
          if (result.ok) {
            toast.success(dictionary.permanentDeleted, { id: toastId });
            return;
          }

          onPermanentDeleteFailed?.(location.id);
          toast.error(getPermanentDeleteErrorMessage(result.status), { id: toastId });
        })
        .catch(() => {
          onPermanentDeleteFailed?.(location.id);
          toast.error(dictionary.permanentDeleteInvalid, { id: toastId });
        });
    });
  }

  return (
    <Drawer direction="right" handleOnly>
      <DrawerTrigger asChild>
        <Button type="button" size="sm" variant={isReviewMode ? "default" : "outline"}>
          <EyeIcon className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="inset-x-auto bottom-0 left-auto right-0 top-0 mt-0 flex h-[100dvh] max-h-[100dvh] w-[min(100vw,42rem)] max-w-[100vw] overflow-hidden rounded-none border-l">
        <DrawerHeader className="relative shrink-0 border-b pr-14 text-left">
          <DrawerTitle>{location.name}</DrawerTitle>
          <DrawerDescription>{getTypeLabel(location.locationType, dictionary)}</DrawerDescription>
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
          <div className="grid gap-5">
            <LocationImageGallery media={location.media} label={location.name} />

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={location.status === "approved" ? "default" : "secondary"}>
                {getStatusLabel(location.status, dictionary)}
              </Badge>
              {location.latestReview?.reviewerName || location.approvedByName ? (
                <span className="text-sm text-muted-foreground">
                  {dictionary.reviewedBy}: {location.approvedByName ?? location.latestReview?.reviewerName}
                </span>
              ) : null}
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailItem label={dictionary.name} value={location.name} />
              <DetailItem label={dictionary.type} value={getTypeLabel(location.locationType, dictionary)} />
              <DetailItem
                label={dictionary.coordinates}
                value={`${formatCoordinate(location.latitude)}, ${formatCoordinate(location.longitude)}`}
              />
              <DetailItem label={dictionary.temperature} value={temperature} />
              <DetailItem label={dictionary.created} value={formatDate(locale, location.createdAt)} />
              <DetailItem label={dictionary.updated} value={formatDate(locale, location.updatedAt)} />
            </dl>

            <section className="grid gap-2">
              <h3 className="text-sm font-semibold">{dictionary.description}</h3>
              <p className="whitespace-pre-wrap rounded-md border p-3 text-sm text-muted-foreground">
                {location.description || "-"}
              </p>
            </section>

            <section className="grid gap-2">
              <h3 className="text-sm font-semibold">{dictionary.accessInfo}</h3>
              <p className="whitespace-pre-wrap rounded-md border p-3 text-sm text-muted-foreground">
                {location.accessInfo || "-"}
              </p>
            </section>

            <section className="grid gap-2">
              <h3 className="text-sm font-semibold">{dictionary.latestReview}</h3>
              <p className="whitespace-pre-wrap rounded-md border p-3 text-sm text-muted-foreground">
                {location.latestReview?.reason || "-"}
              </p>
            </section>

            {isReviewMode && location.status === "pending" ? (
              <section className="grid gap-3 rounded-md border p-3">
                <form action={reviewAction}>
                  <input type="hidden" name="locationId" value={location.id} />
                  <input type="hidden" name="action" value="approve" />
                  <Button type="submit" className="w-full">
                    {dictionary.approve}
                  </Button>
                </form>
                <form action={reviewAction} className="grid gap-2">
                  <input type="hidden" name="locationId" value={location.id} />
                  <input type="hidden" name="action" value="reject" />
                  <Label htmlFor={`review-reason-${location.id}`}>{dictionary.reason}</Label>
                  <Textarea id={`review-reason-${location.id}`} name="reason" required rows={3} />
                  <Button type="submit" variant="outline" className="w-full">
                    {dictionary.reject}
                  </Button>
                </form>
              </section>
            ) : null}
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t bg-background">
          {mode === "deleted" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" disabled={isPending} onClick={handleRestore}>
                <RotateCcwIcon className="h-4 w-4" />
                {dictionary.restore}
              </Button>
              <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                  setIsDeleteDialogOpen(open);
                  if (!open) {
                    setDeleteConfirmation("");
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isPending}>
                    <Trash2Icon className="h-4 w-4" />
                    {dictionary.deletePermanently}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{dictionary.permanentDeleteTitle}</DialogTitle>
                    <DialogDescription>{dictionary.permanentDeleteDescription}</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePermanentDelete} className="grid gap-4">
                    <input type="hidden" name="locationId" value={location.id} />
                    <div className="grid gap-2">
                      <Label htmlFor={`permanent-delete-${location.id}`}>
                        {dictionary.permanentDeleteInputLabel}
                      </Label>
                      <Input
                        id={`permanent-delete-${location.id}`}
                        name="confirmation"
                        autoComplete="off"
                        placeholder={dictionary.permanentDeleteInputPlaceholder}
                        value={deleteConfirmation}
                        onChange={(event) => setDeleteConfirmation(event.target.value)}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          {dictionary.cancel}
                        </Button>
                      </DialogClose>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={isPending || deleteConfirmation !== "delete"}
                      >
                        <Trash2Icon className="h-4 w-4" />
                        {dictionary.permanentDeleteAction}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          ) : null}
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
