import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfileCompletion } from "@/lib/practitioners/profile-completion";
import type { PractitionerProfile } from "@/server/models/practitioner.model";

type ProfileReadinessCardProps = {
  profile: PractitionerProfile | null;
  dictionary: {
    profileReadiness: string;
    profileReadinessDescription: string;
    profileFields: string;
    publicProfile: string;
    privateProfile: string;
  };
};

export function ProfileReadinessCard({ profile, dictionary }: ProfileReadinessCardProps) {
  const completion = getProfileCompletion(profile);

  if (completion.completedFields === completion.totalFields) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.profileReadiness}</CardTitle>
        <CardDescription>{dictionary.profileReadinessDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          aria-label={dictionary.profileReadiness}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={completion.percentComplete}
          className="h-3 overflow-hidden rounded-full bg-muted"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${completion.percentComplete}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {completion.completedFields}/{completion.totalFields} {dictionary.profileFields}
          </span>
          <Badge variant={profile?.isPublic ? "default" : "secondary"}>
            {profile?.isPublic ? dictionary.publicProfile : dictionary.privateProfile}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
