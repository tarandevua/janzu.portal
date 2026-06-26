import { CheckCircle2Icon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { CertificationApprovalCandidate } from "@/server/models/certification.model";
import { approveCertification } from "@/features/certification/actions";
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

type CertificationApprovalQueueProps = {
  locale: Locale;
  candidates: CertificationApprovalCandidate[];
  status?: string;
  dictionary: {
    approvalTitle: string;
    approvalDescription: string;
    practitioner: string;
    location: string;
    sessions: string;
    status: string;
    action: string;
    approve: string;
    approved: string;
    eligible: string;
    emptyQueue: string;
    approvalSaved: string;
    approvalInvalid: string;
    approvalForbidden: string;
  };
};

function getStatusVariant(status: CertificationApprovalCandidate["status"]) {
  return status === "approved" ? "default" : "secondary";
}

function getStatusLabel(
  status: CertificationApprovalCandidate["status"],
  dictionary: CertificationApprovalQueueProps["dictionary"]
) {
  if (status === "approved") {
    return dictionary.approved;
  }

  return dictionary.eligible;
}

function getStatusMessage(
  status: string | undefined,
  dictionary: CertificationApprovalQueueProps["dictionary"]
) {
  if (status === "approved") {
    return dictionary.approvalSaved;
  }

  if (status === "approval-invalid") {
    return dictionary.approvalInvalid;
  }

  if (status === "approval-forbidden") {
    return dictionary.approvalForbidden;
  }

  return null;
}

export function CertificationApprovalQueue({
  locale,
  candidates,
  status,
  dictionary,
}: CertificationApprovalQueueProps) {
  const statusMessage = getStatusMessage(status, dictionary);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.approvalTitle}</CardTitle>
        <CardDescription>{dictionary.approvalDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {statusMessage ? (
          <Alert>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        ) : null}

        {candidates.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            {dictionary.emptyQueue}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dictionary.practitioner}</TableHead>
                <TableHead>{dictionary.location}</TableHead>
                <TableHead>{dictionary.sessions}</TableHead>
                <TableHead>{dictionary.status}</TableHead>
                <TableHead className="text-right">{dictionary.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div className="font-medium">{candidate.practitionerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {candidate.practitionerEmail}
                    </div>
                  </TableCell>
                  <TableCell>
                    {[candidate.city, candidate.country].filter(Boolean).join(", ") || "-"}
                  </TableCell>
                  <TableCell>
                    {candidate.validatedSessionsCount}/{candidate.requiredSessionsCount}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(candidate.status)}>
                      {getStatusLabel(candidate.status, dictionary)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {candidate.status === "approved" ? (
                      <Button type="button" size="sm" variant="secondary" disabled>
                        <CheckCircle2Icon />
                        {dictionary.approved}
                      </Button>
                    ) : (
                      <form action={approveCertification.bind(null, locale)}>
                        <input
                          type="hidden"
                          name="practitionerId"
                          value={candidate.practitionerId}
                        />
                        <Button type="submit" size="sm">
                          <CheckCircle2Icon />
                          {dictionary.approve}
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
