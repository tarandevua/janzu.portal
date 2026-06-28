import Image from "next/image";
import { MapPinIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LocationWithMedia } from "@/server/models/location.model";
import { updateRejectedLocation } from "@/features/locations/actions";
import { LocationEditDrawer } from "@/features/locations/components/location-edit-drawer";
import { LocationForm } from "@/features/locations/components/location-form";
import { formatCoordinate } from "@/features/maps/utils";
import { getLocationMediaItems } from "@/features/locations/utils/location-media";
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

type LocationListProps = {
  locale: Locale;
  locations: LocationWithMedia[];
  dictionary: {
    formTitle: string;
    formDescription: string;
    listTitle: string;
    listDescription: string;
    empty: string;
    name: string;
    type: string;
    description: string;
    latitude: string;
    longitude: string;
    temperature: string;
    temperatureUnit: string;
    celsius: string;
    fahrenheit: string;
    mapPickerTitle: string;
    mapPickerDescription: string;
    selectedCoordinates: string;
    noCoordinatesSelected: string;
    accessInfo: string;
    photoUrl: string;
    photoUpload: string;
    photoUploadHelp: string;
    coordinates: string;
    status: string;
    latestReview: string;
    action: string;
    edit: string;
    update: string;
    editRejectedDescription: string;
    submit: string;
    created: string;
    updated: string;
    invalid: string;
    imageType: string;
    imageSize: string;
    imageCount: string;
    imageConfig: string;
    imageAuth: string;
    imageBucket: string;
    imageUpload: string;
    pool: string;
    spa: string;
    naturalWater: string;
    pending: string;
    approved: string;
    rejected: string;
  };
};

function getTypeLabel(locationType: LocationWithMedia["locationType"], dictionary: LocationListProps["dictionary"]) {
  if (locationType === "spa") {
    return dictionary.spa;
  }

  if (locationType === "natural_water") {
    return dictionary.naturalWater;
  }

  return dictionary.pool;
}

function getStatusLabel(status: LocationWithMedia["status"], dictionary: LocationListProps["dictionary"]) {
  if (status === "approved") {
    return dictionary.approved;
  }

  if (status === "rejected") {
    return dictionary.rejected;
  }

  return dictionary.pending;
}

export function LocationList({ locale, locations, dictionary }: LocationListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.listTitle}</CardTitle>
        <CardDescription>{dictionary.listDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {locations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
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
                {locations.map((location) => {
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
                    <TableCell>
                      {location.temperatureValue !== null && location.temperatureUnit
                        ? `${location.temperatureValue}°${location.temperatureUnit === "celsius" ? "C" : "F"}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={location.status === "approved" ? "default" : "secondary"}>
                        {getStatusLabel(location.status, dictionary)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                      {location.latestReview?.reason ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {location.status === "rejected" ? (
                        <LocationEditDrawer
                          title={dictionary.edit}
                          description={dictionary.editRejectedDescription}
                          triggerLabel={dictionary.edit}
                        >
                          <LocationForm
                            locale={locale}
                            variant="plain"
                            action={updateRejectedLocation.bind(null, locale, location.id)}
                            initialValues={{
                              name: location.name,
                              locationType: location.locationType,
                              description: location.description,
                              latitude: location.latitude,
                              longitude: location.longitude,
                              temperatureValue: location.temperatureValue,
                              temperatureUnit: location.temperatureUnit,
                              accessInfo: location.accessInfo,
                            }}
                            submitLabel={dictionary.update}
                            dictionary={dictionary}
                          />
                        </LocationEditDrawer>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
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
