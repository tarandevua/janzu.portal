"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import { MapPinIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";
import type { LocationWithMedia } from "@/server/models/location.model";
import { restoreDeletedLocationInline, type LocationRestoreActionResult } from "@/features/locations/actions";
import { getLocationMediaItems } from "@/features/locations/utils/location-media";
import { formatCoordinate } from "@/features/maps/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DeletedLocationListProps = {
  locale: Locale;
  locations: LocationWithMedia[];
  dictionary: {
    deletedTitle: string;
    deletedDescription: string;
    emptyDeleted: string;
    name: string;
    type: string;
    coordinates: string;
    status: string;
    action: string;
    restore: string;
    restoreSaving: string;
    restored: string;
    restoreInvalid: string;
    restoreForbidden: string;
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
  dictionary: DeletedLocationListProps["dictionary"]
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
  dictionary: DeletedLocationListProps["dictionary"]
) {
  if (status === "approved") {
    return dictionary.approved;
  }

  if (status === "rejected") {
    return dictionary.rejected;
  }

  return dictionary.pending;
}

export function DeletedLocationList({
  locale,
  locations,
  dictionary,
}: DeletedLocationListProps) {
  const [visibleLocations, setVisibleLocations] = useState(locations);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setVisibleLocations(locations);
  }, [locations]);

  function handleOptimisticRestore(locationId: string) {
    setVisibleLocations((currentLocations) =>
      currentLocations.filter((location) => location.id !== locationId)
    );
  }

  function handleRestoreFailed(locationId: string) {
    const restoredLocation = locations.find((location) => location.id === locationId);

    if (!restoredLocation) {
      return;
    }

    setVisibleLocations((currentLocations) => {
      if (currentLocations.some((location) => location.id === locationId)) {
        return currentLocations;
      }

      return [restoredLocation, ...currentLocations];
    });
  }

  function getErrorMessage(status: LocationRestoreActionResult["status"]) {
    if (status === "restore-forbidden") {
      return dictionary.restoreForbidden;
    }

    return dictionary.restoreInvalid;
  }

  function handleRestoreSubmit(locationId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    handleOptimisticRestore(locationId);
    const toastId = toast.loading(dictionary.restoreSaving);

    startTransition(() => {
      void restoreDeletedLocationInline(locale, formData)
        .then((result) => {
          if (result.ok) {
            toast.success(dictionary.restored, { id: toastId });
            return;
          }

          handleRestoreFailed(locationId);
          toast.error(getErrorMessage(result.status), { id: toastId });
        })
        .catch(() => {
          handleRestoreFailed(locationId);
          toast.error(dictionary.restoreInvalid, { id: toastId });
        });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.deletedTitle}</CardTitle>
        <CardDescription>{dictionary.deletedDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {visibleLocations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.emptyDeleted}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.name}</TableHead>
                  <TableHead>{dictionary.type}</TableHead>
                  <TableHead>{dictionary.coordinates}</TableHead>
                  <TableHead>{dictionary.status}</TableHead>
                  <TableHead className="text-right">{dictionary.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLocations.map((location) => {
                  const [media] = getLocationMediaItems(location.media);

                  return (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {media ? (
                            <Image
                              src={media.url}
                              alt={media.altText ?? location.name}
                              width={96}
                              height={72}
                              className="h-12 w-16 rounded-md object-cover"
                            />
                          ) : null}
                          <span>{location.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeLabel(location.locationType, dictionary)}</TableCell>
                      <TableCell>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                        >
                          <MapPinIcon className="size-4" />
                          {formatCoordinate(location.latitude)}, {formatCoordinate(location.longitude)}
                        </a>
                      </TableCell>
                      <TableCell>{getStatusLabel(location.status, dictionary)}</TableCell>
                      <TableCell className="text-right">
                        <form onSubmit={(event) => handleRestoreSubmit(location.id, event)}>
                          <input type="hidden" name="locationId" value={location.id} />
                          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
                            <RotateCcwIcon />
                            {dictionary.restore}
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
