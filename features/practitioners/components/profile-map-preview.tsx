import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClusteredMap } from "@/features/maps/components/clustered-map";
import { toPractitionerMapMarkers } from "@/features/practitioners/utils/map-points";
import type { Locale } from "@/lib/i18n/config";
import type { PractitionerMapPoint } from "@/server/models/practitioner.model";

type ProfileMapPreviewDictionary = {
  title: string;
  description: string;
  publicTitle: string;
  publicDescription: string;
  publicEmpty: string;
  communityTitle: string;
  communityDescription: string;
  communityEmpty: string;
  loading: string;
  error: string;
};

export function ProfileMapPreview({
  locale,
  publicPoints,
  communityPoints,
  dictionary,
}: {
  locale: Locale;
  publicPoints: PractitionerMapPoint[];
  communityPoints: PractitionerMapPoint[];
  dictionary: ProfileMapPreviewDictionary;
}) {
  const options = { locale, detailsLabel: "", includeDetailsLink: false } as const;

  return (
    <Card id="map-preview">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <section className="grid gap-2" aria-labelledby="public-map-preview-title">
          <div>
            <h3 id="public-map-preview-title" className="font-medium">{dictionary.publicTitle}</h3>
            <p className="text-sm text-muted-foreground">{dictionary.publicDescription}</p>
          </div>
          <ClusteredMap
            markers={toPractitionerMapMarkers(publicPoints, options)}
            emptyText={dictionary.publicEmpty}
            loadingText={dictionary.loading}
            errorText={dictionary.error}
            className="min-h-[320px]"
          />
        </section>
        <section className="grid gap-2" aria-labelledby="community-map-preview-title">
          <div>
            <h3 id="community-map-preview-title" className="font-medium">{dictionary.communityTitle}</h3>
            <p className="text-sm text-muted-foreground">{dictionary.communityDescription}</p>
          </div>
          <ClusteredMap
            markers={toPractitionerMapMarkers(communityPoints, options)}
            emptyText={dictionary.communityEmpty}
            loadingText={dictionary.loading}
            errorText={dictionary.error}
            className="min-h-[320px]"
          />
        </section>
      </CardContent>
    </Card>
  );
}
