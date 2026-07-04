"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import type { LocationWithMedia } from "@/server/models/location.model";
import { deleteLocationSubmissionInline } from "@/features/locations/actions";
import { LocationDeleteConfirmation } from "@/features/locations/components/location-delete-confirmation";
import { LocationPreviewDrawer } from "@/features/locations/components/location-preview-drawer";
import { formatCoordinate } from "@/features/maps/utils";
import { getLocationMediaItems } from "@/features/locations/utils/location-media";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LocationReviewQueueProps = {
  locale: Locale;
  locations: LocationWithMedia[];
  status?: string;
  canDeleteAnyLocations?: boolean;
  dictionary: {
    reviewTitle: string;
    reviewDescription: string;
    emptyReview: string;
    name: string;
    type: string;
    description: string;
    coordinates: string;
    temperature: string;
    accessInfo: string;
    status: string;
    reason: string;
    reviewedBy: string;
    latestReview: string;
    action: string;
    view: string;
    review: string;
    close: string;
    delete: string;
    cancel: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    deleteConfirmAction: string;
    deleteSaving: string;
    approve: string;
    reject: string;
    pool: string;
    spa: string;
    naturalWater: string;
    pending: string;
    approved: string;
    rejected: string;
    created: string;
    updated: string;
    reviewApproved: string;
    reviewRejected: string;
    reviewInvalid: string;
    reviewForbidden: string;
    deleted: string;
    deleteInvalid: string;
    deleteForbidden: string;
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
  };
};

function getTypeLabel(
  locationType: LocationWithMedia["locationType"],
  dictionary: LocationReviewQueueProps["dictionary"]
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
  dictionary: LocationReviewQueueProps["dictionary"]
) {
  if (status === "approved") {
    return dictionary.approved;
  }

  if (status === "rejected") {
    return dictionary.rejected;
  }

  return dictionary.pending;
}

function getStatusMessage(
  status: string | undefined,
  dictionary: LocationReviewQueueProps["dictionary"]
) {
  if (status === "approved") {
    return dictionary.reviewApproved;
  }

  if (status === "rejected") {
    return dictionary.reviewRejected;
  }

  if (status === "review-invalid") {
    return dictionary.reviewInvalid;
  }

  if (status === "review-forbidden") {
    return dictionary.reviewForbidden;
  }

  if (status === "deleted") {
    return dictionary.deleted;
  }

  if (status === "delete-invalid") {
    return dictionary.deleteInvalid;
  }

  if (status === "delete-forbidden") {
    return dictionary.deleteForbidden;
  }

  return null;
}

export function LocationReviewQueue({
  locale,
  locations,
  status,
  canDeleteAnyLocations = false,
  dictionary,
}: LocationReviewQueueProps) {
  const deleteAction = deleteLocationSubmissionInline.bind(null, locale);
  const [visibleLocations, setVisibleLocations] = useState(locations);
  const message = getStatusMessage(status, dictionary);

  useEffect(() => {
    setVisibleLocations(locations);
  }, [locations]);

  function handleOptimisticDelete(locationId: string) {
    setVisibleLocations((currentLocations) =>
      currentLocations.filter((location) => location.id !== locationId)
    );
  }

  function handleDeleteFailed(locationId: string) {
    const deletedLocation = locations.find((location) => location.id === locationId);

    if (!deletedLocation) {
      return;
    }

    setVisibleLocations((currentLocations) => {
      if (currentLocations.some((location) => location.id === locationId)) {
        return currentLocations;
      }

      return [deletedLocation, ...currentLocations];
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.reviewTitle}</CardTitle>
        <CardDescription>{dictionary.reviewDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {message ? (
          <Alert
            variant={
              status === "review-invalid" ||
              status === "review-forbidden" ||
              status === "delete-invalid" ||
              status === "delete-forbidden"
                ? "destructive"
                : "default"
            }
          >
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        {visibleLocations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.emptyReview}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.name}</TableHead>
                  <TableHead>{dictionary.type}</TableHead>
                  <TableHead>{dictionary.coordinates}</TableHead>
                  <TableHead>{dictionary.temperature}</TableHead>
                  <TableHead>{dictionary.status}</TableHead>
                  <TableHead>{dictionary.latestReview}</TableHead>
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
                      {formatCoordinate(location.latitude)}, {formatCoordinate(location.longitude)}
                    </TableCell>
                    <TableCell>
                      {location.temperatureValue !== null && location.temperatureUnit
                        ? `${location.temperatureValue}°${location.temperatureUnit === "celsius" ? "C" : "F"}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1">
                        <Badge className="w-fit" variant={location.status === "approved" ? "default" : "secondary"}>
                          {getStatusLabel(location.status, dictionary)}
                        </Badge>
                        {location.approvedByName ? (
                          <span className="text-xs text-muted-foreground">
                            {dictionary.reviewedBy}: {location.approvedByName}
                          </span>
                        ) : location.latestReview?.reviewerName ? (
                          <span className="text-xs text-muted-foreground">
                            {dictionary.reviewedBy}: {location.latestReview.reviewerName}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                      {location.latestReview?.reason ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="grid justify-end gap-2">
                        <LocationPreviewDrawer
                          locale={locale}
                          location={location}
                          mode="review"
                          dictionary={dictionary}
                        />
                        {canDeleteAnyLocations ? (
                          <LocationDeleteConfirmation
                            locationId={location.id}
                            locationName={location.name}
                            action={deleteAction}
                            onOptimisticDelete={handleOptimisticDelete}
                            onDeleteFailed={handleDeleteFailed}
                            fullWidth
                            dictionary={dictionary}
                          />
                        ) : null}
                      </div>
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
