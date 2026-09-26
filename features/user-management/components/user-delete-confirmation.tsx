"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { softDeleteUserInline } from "@/features/user-management/actions";
import type { UserManagementDictionary } from "@/features/user-management/components/user-role-management-table";
import type { Locale } from "@/lib/i18n/config";

export function UserDeleteConfirmation({
  locale,
  userId,
  userName,
  dictionary,
}: {
  locale: Locale;
  userId: string;
  userName: string;
  dictionary: UserManagementDictionary;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function getErrorMessage(status: string) {
    if (status === "delete-forbidden") {
      return dictionary.userDeleteForbidden;
    }

    if (status === "delete-invalid") {
      return dictionary.userDeleteInvalid;
    }

    return dictionary.userDeleteFailed;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const toastId = toast.loading(dictionary.deletingUser);

    startTransition(() => {
      void softDeleteUserInline(locale, formData)
        .then((result) => {
          if (result.ok) {
            setIsOpen(false);
            toast.success(dictionary.userDeleted, { id: toastId });
            router.refresh();
            return;
          }

          toast.error(getErrorMessage(result.status), { id: toastId });
        })
        .catch(() => {
          toast.error(dictionary.userDeleteFailed, { id: toastId });
        });
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" disabled={isPending}>
          <Trash2Icon className="h-4 w-4" />
          {dictionary.deleteUser}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dictionary.deleteUserTitle}</DialogTitle>
          <DialogDescription>
            {dictionary.deleteUserDescription}{" "}
            <span className="font-medium text-foreground">{userName}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              {dictionary.cancel}
            </Button>
          </DialogClose>
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="userId" value={userId} />
            <Button type="submit" variant="destructive" disabled={isPending}>
              <Trash2Icon className="h-4 w-4" />
              {isPending ? dictionary.deletingUser : dictionary.deleteUser}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
