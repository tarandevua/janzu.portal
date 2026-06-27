import type { LocationWithMedia } from "@/server/models/location.model";
import { ClusteredMap } from "@/features/maps/components/clustered-map";
import type { MapMarker } from "@/features/maps/types";
import { formatCoordinate } from "@/features/maps/utils";
import { LocationImageGallery } from "@/features/locations/components/location-image-gallery";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PublicLocationListProps = {
  locations: LocationWithMedia[];
  dictionary: {
    publicTitle: string;
    publicDescription: string;
    emptyPublic: string;
    pool: string;
    spa: string;
    naturalWater: string;
    coordinates: string;
    accessInfo: string;
    emptyMap: string;
  };
};

function getTypeLabel(
  locationType: LocationWithMedia["locationType"],
  dictionary: PublicLocationListProps["dictionary"]
) {
  if (locationType === "spa") {
    return dictionary.spa;
  }

  if (locationType === "natural_water") {
    return dictionary.naturalWater;
  }

  return dictionary.pool;
}

export function PublicLocationList({ locations, dictionary }: PublicLocationListProps) {
  const markers: MapMarker[] = locations.map((location) => ({
    id: location.id,
    kind: "location",
    title: location.name,
    description: location.description,
    latitude: location.latitude,
    longitude: location.longitude,
    meta: getTypeLabel(location.locationType, dictionary),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">{dictionary.publicTitle}</h1>
        <p className="max-w-3xl text-muted-foreground">{dictionary.publicDescription}</p>
      </div>

      <ClusteredMap markers={markers} emptyText={dictionary.emptyMap} className="min-h-[460px]" />

      {locations.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {dictionary.emptyPublic}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{location.name}</CardTitle>
                    <CardDescription>
                      {dictionary.coordinates}: {formatCoordinate(location.latitude)},{" "}
                      {formatCoordinate(location.longitude)}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{getTypeLabel(location.locationType, dictionary)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <LocationImageGallery media={location.media} label={location.name} />
                {location.description ? <p>{location.description}</p> : null}
                {location.accessInfo ? (
                  <p className="text-muted-foreground">
                    {dictionary.accessInfo}: {location.accessInfo}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
