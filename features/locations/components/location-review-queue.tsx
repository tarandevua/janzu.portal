import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LocationWithMedia } from "@/server/models/location.model";
import { reviewLocationSubmission } from "@/features/locations/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

type LocationReviewQueueProps = {
  locale: Locale;
  locations: LocationWithMedia[];
  status?: string;
  dictionary: {
    reviewTitle: string;
    reviewDescription: string;
    emptyReview: string;
    name: string;
    type: string;
    coordinates: string;
    status: string;
    action: string;
    approve: string;
    reject: string;
    pool: string;
    spa: string;
    naturalWater: string;
    pending: string;
    approved: string;
    rejected: string;
    reviewApproved: string;
    reviewRejected: string;
    reviewInvalid: string;
    reviewForbidden: string;
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

  return null;
}

export function LocationReviewQueue({
  locale,
  locations,
  status,
  dictionary,
}: LocationReviewQueueProps) {
  const action = reviewLocationSubmission.bind(null, locale);
  const message = getStatusMessage(status, dictionary);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.reviewTitle}</CardTitle>
        <CardDescription>{dictionary.reviewDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {message ? (
          <Alert variant={status === "review-invalid" || status === "review-forbidden" ? "destructive" : "default"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        {locations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.emptyReview}</p>
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
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>{getTypeLabel(location.locationType, dictionary)}</TableCell>
                    <TableCell>
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={location.status === "approved" ? "default" : "secondary"}>
                        {getStatusLabel(location.status, dictionary)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {location.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <form action={action}>
                            <input type="hidden" name="locationId" value={location.id} />
                            <input type="hidden" name="action" value="approve" />
                            <Button type="submit" size="sm">
                              <CheckCircle2Icon />
                              {dictionary.approve}
                            </Button>
                          </form>
                          <form action={action}>
                            <input type="hidden" name="locationId" value={location.id} />
                            <input type="hidden" name="action" value="reject" />
                            <Button type="submit" size="sm" variant="outline">
                              <XCircleIcon />
                              {dictionary.reject}
                            </Button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {getStatusLabel(location.status, dictionary)}
                        </span>
                      )}
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
