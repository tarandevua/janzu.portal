import type { CertificationSummary } from "@/server/models/certification.model";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CertificationProgressCardProps = {
  progress: CertificationSummary;
  dictionary: {
    title: string;
    description: string;
    validated: string;
    required: string;
    remaining: string;
    status: string;
    inProgress: string;
    eligible: string;
    approved: string;
  };
};

function getStatusLabel(
  status: CertificationSummary["status"],
  dictionary: CertificationProgressCardProps["dictionary"]
) {
  if (status === "approved") {
    return dictionary.approved;
  }

  if (status === "eligible") {
    return dictionary.eligible;
  }

  return dictionary.inProgress;
}

export function CertificationProgressCard({
  progress,
  dictionary,
}: CertificationProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{dictionary.title}</CardTitle>
            <CardDescription>{dictionary.description}</CardDescription>
          </div>
          <Badge variant={progress.status === "approved" ? "default" : "secondary"}>
            {getStatusLabel(progress.status, dictionary)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-sm text-muted-foreground">{dictionary.validated}</p>
            <p className="text-2xl font-semibold">{progress.validatedSessionsCount}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-sm text-muted-foreground">{dictionary.required}</p>
            <p className="text-2xl font-semibold">{progress.requiredSessionsCount}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-sm text-muted-foreground">{dictionary.remaining}</p>
            <p className="text-2xl font-semibold">{progress.remainingSessionsCount}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-sm text-muted-foreground">{dictionary.status}</p>
            <p className="text-lg font-semibold">{getStatusLabel(progress.status, dictionary)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
