import type { LocationWithMedia } from "@/server/models/location.model";
import { formatCoordinate } from "@/features/maps/utils";
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
  locations: LocationWithMedia[];
  dictionary: {
    listTitle: string;
    listDescription: string;
    empty: string;
    name: string;
    type: string;
    coordinates: string;
    status: string;
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

export function LocationList({ locations, dictionary }: LocationListProps) {
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
                  <TableHead>{dictionary.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>{getTypeLabel(location.locationType, dictionary)}</TableCell>
                    <TableCell>
                      {formatCoordinate(location.latitude)}, {formatCoordinate(location.longitude)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={location.status === "approved" ? "default" : "secondary"}>
                        {getStatusLabel(location.status, dictionary)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
