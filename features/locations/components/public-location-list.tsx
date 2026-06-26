import type { LocationWithMedia } from "@/server/models/location.model";
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
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">{dictionary.publicTitle}</h1>
        <p className="max-w-3xl text-muted-foreground">{dictionary.publicDescription}</p>
      </div>

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
                      {dictionary.coordinates}: {location.latitude.toFixed(4)},{" "}
                      {location.longitude.toFixed(4)}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{getTypeLabel(location.locationType, dictionary)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                {location.media[0]?.publicUrl ? (
                  <div
                    aria-label={location.media[0].altText ?? location.name}
                    role="img"
                    className="aspect-video w-full rounded-md bg-cover bg-center"
                    style={{ backgroundImage: `url(${location.media[0].publicUrl})` }}
                  />
                ) : null}
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
