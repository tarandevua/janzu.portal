import Link from "next/link";
import { Shell, StarIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LocationWithMedia } from "@/server/models/location.model";
import {
  submitLocationCommunityReview,
  toggleHelpfulLocationReview,
} from "@/features/locations/actions";
import { ClusteredMap } from "@/features/maps/components/clustered-map";
import type { MapMarker } from "@/features/maps/types";
import { formatCoordinate } from "@/features/maps/utils";
import { LocationImageGallery } from "@/features/locations/components/location-image-gallery";
import { LocationTemperatureDisplay } from "@/features/locations/components/location-temperature-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PublicLocationListProps = {
  locale: Locale;
  locations: LocationWithMedia[];
  canReview: boolean;
  currentUserId: string | null;
  dictionary: {
    publicTitle: string;
    publicDescription: string;
    backToPortal: string;
    emptyPublic: string;
    pool: string;
    spa: string;
    naturalWater: string;
    coordinates: string;
    accessInfo: string;
    temperature: string;
    celsius: string;
    fahrenheit: string;
    emptyMap: string;
    rating: string;
    reviews: string;
    reviewText: string;
    submitReview: string;
    updateReview: string;
    communityReviews: string;
    noCommunityReviews: string;
    helpful: string;
    markedHelpful: string;
    yourReview: string;
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

function formatRating(value: number | null | undefined) {
  return typeof value === "number" ? value.toFixed(1) : "—";
}

function RatingStars({ value }: { value: number | null | undefined }) {
  const activeStars = typeof value === "number" ? Math.round(value) : 0;

  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon
          key={index}
          className={
            index < activeStars
              ? "size-4 fill-amber-400 text-amber-500"
              : "size-4 text-muted-foreground/40"
          }
        />
      ))}
    </span>
  );
}

function sortCommunityReviews(
  reviews: NonNullable<LocationWithMedia["communityReviews"]>,
  currentUserId: string | null
) {
  return [...reviews].sort((left, right) => {
    if (left.reviewerId === currentUserId) {
      return -1;
    }

    if (right.reviewerId === currentUserId) {
      return 1;
    }

    return right.helpfulCount - left.helpfulCount || right.createdAt.localeCompare(left.createdAt);
  });
}

export function PublicLocationList({
  locale,
  locations,
  canReview,
  currentUserId,
  dictionary,
}: PublicLocationListProps) {
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
        {canReview ? (
          <Button asChild variant="ghost" className="w-fit">
            <Link href={`/${locale}`}>
              <Shell className="h-5 w-5" />
              <span className="text-base font-semibold">Janzu Portal</span>
            </Link>
          </Button>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-normal">{dictionary.publicTitle}</h1>
        </div>
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
          {locations.map((location) => {
            const ownReview = location.communityReviews?.find(
              (review) => review.reviewerId === currentUserId
            );
            const reviews = sortCommunityReviews(location.communityReviews ?? [], currentUserId);

            return (
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
                <LocationTemperatureDisplay
                  value={location.temperatureValue}
                  unit={location.temperatureUnit}
                  dictionary={dictionary}
                />
                {canReview ? (
                  <div className="grid gap-3 border-t pt-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-medium">{dictionary.communityReviews}</h3>
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <RatingStars value={location.averageRating} />
                        <span>
                          {formatRating(location.averageRating)} · {location.reviewsCount ?? 0}{" "}
                          {dictionary.reviews}
                        </span>
                      </span>
                    </div>
                    <form action={submitLocationCommunityReview.bind(null, locale)} className="grid gap-2">
                      <Input type="hidden" name="locationId" value={location.id} />
                      <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                        <div className="grid gap-1">
                          <Label htmlFor={`rating-${location.id}`}>{dictionary.rating}</Label>
                          <Select name="rating" required defaultValue={String(ownReview?.rating ?? 5)}>
                            <SelectTrigger id={`rating-${location.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 4, 3, 2, 1].map((rating) => (
                                <SelectItem key={rating} value={String(rating)}>
                                  {rating}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1">
                          <Label htmlFor={`reviewText-${location.id}`}>{dictionary.reviewText}</Label>
                          <Textarea
                            id={`reviewText-${location.id}`}
                            name="reviewText"
                            rows={2}
                            defaultValue={ownReview?.reviewText ?? ""}
                          />
                        </div>
                      </div>
                      <Button type="submit" size="sm" className="w-fit">
                        {ownReview ? dictionary.updateReview : dictionary.submitReview}
                      </Button>
                    </form>
                    <div className="grid gap-2">
                      {reviews.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{dictionary.noCommunityReviews}</p>
                      ) : (
                        reviews.map((review) => (
                          <div key={review.id} className="grid gap-2 rounded-md border p-3">
                            <div className="flex items-center justify-between gap-3">
                              <Badge variant={review.reviewerId === currentUserId ? "default" : "secondary"}>
                                <RatingStars value={review.rating} />
                                <span className="ml-1">
                                  {review.reviewerId === currentUserId
                                    ? dictionary.yourReview
                                    : `${dictionary.rating}: ${review.rating}`}
                                </span>
                              </Badge>
                              {review.reviewerId !== currentUserId ? (
                                <form action={toggleHelpfulLocationReview.bind(null, locale)}>
                                  <Input type="hidden" name="reviewId" value={review.id} />
                                  <Button type="submit" size="sm" variant="ghost">
                                    {review.viewerMarkedHelpful
                                      ? dictionary.markedHelpful
                                      : dictionary.helpful}{" "}
                                    ({review.helpfulCount})
                                  </Button>
                                </form>
                              ) : null}
                            </div>
                            {review.reviewText ? <p>{review.reviewText}</p> : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
