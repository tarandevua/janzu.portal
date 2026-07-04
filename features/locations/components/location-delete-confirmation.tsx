"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
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
import type { LocationDeleteActionResult } from "@/features/locations/actions";

type LocationDeleteConfirmationProps = {
  locationId: string;
  locationName: string;
  action: (formData: FormData) => Promise<LocationDeleteActionResult>;
  onOptimisticDelete: (locationId: string) => void;
  onDeleteFailed: (locationId: string) => void;
  fullWidth?: boolean;
  dictionary: {
    delete: string;
    cancel: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    deleteConfirmAction: string;
    deleteSaving: string;
    deleted: string;
    deleteInvalid: string;
    deleteForbidden: string;
  };
};

export function LocationDeleteConfirmation({
  locationId,
  locationName,
  action,
  onOptimisticDelete,
  onDeleteFailed,
  fullWidth = false,
  dictionary,
}: LocationDeleteConfirmationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function getErrorMessage(status: LocationDeleteActionResult["status"]) {
    if (status === "delete-forbidden") {
      return dictionary.deleteForbidden;
    }

    return dictionary.deleteInvalid;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsOpen(false);
    onOptimisticDelete(locationId);
    const toastId = toast.loading(dictionary.deleteSaving);

    startTransition(() => {
      void action(formData)
        .then((result) => {
          if (result.ok) {
            toast.success(dictionary.deleted, { id: toastId });
            return;
          }

          onDeleteFailed(locationId);
          toast.error(getErrorMessage(result.status), { id: toastId });
        })
        .catch(() => {
          onDeleteFailed(locationId);
          toast.error(dictionary.deleteInvalid, { id: toastId });
        });
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={isPending}
          className={fullWidth ? "w-full" : undefined}
        >
          <Trash2Icon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dictionary.deleteConfirmTitle}</DialogTitle>
          <DialogDescription>
            {dictionary.deleteConfirmDescription}{" "}
            <span className="font-medium text-foreground">{locationName}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              {dictionary.cancel}
            </Button>
          </DialogClose>
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="locationId" value={locationId} />
            <Button type="submit" variant="destructive" className="w-full sm:w-auto" disabled={isPending}>
              <Trash2Icon />
              {dictionary.deleteConfirmAction}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
