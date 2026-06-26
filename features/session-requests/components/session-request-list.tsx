import { CheckIcon, XIcon } from "lucide-react";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
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
import { reviewSessionRequest } from "@/features/session-requests/actions";
import type { Locale } from "@/lib/i18n/config";
import type { SessionRequest } from "@/server/models/session-request.model";

type SessionRequestListProps = {
  locale: Locale;
  requests: SessionRequest[];
  page: number;
  pageSize: number;
  totalCount: number;
  previousHref: string;
  nextHref: string;
  status?: string;
  dictionary: {
    listTitle: string;
    listDescription: string;
    empty: string;
    name: string;
    email: string;
    phone: string;
    preferredDate: string;
    message: string;
    status: string;
    pending: string;
    accepted: string;
    declined: string;
    action: string;
    accept: string;
    decline: string;
    reviewInvalid: string;
    reviewAccepted: string;
    reviewDeclined: string;
    previous: string;
    next: string;
    page: string;
  };
};

function getStatusLabel(status: SessionRequest["status"], dictionary: SessionRequestListProps["dictionary"]) {
  if (status === "accepted") {
    return dictionary.accepted;
  }

  if (status === "declined") {
    return dictionary.declined;
  }

  return dictionary.pending;
}

export function SessionRequestList({
  locale,
  requests,
  page,
  pageSize,
  totalCount,
  previousHref,
  nextHref,
  status,
  dictionary,
}: SessionRequestListProps) {
  const action = reviewSessionRequest.bind(null, locale);

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>{dictionary.listTitle}</CardTitle>
        <CardDescription>{dictionary.listDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "request-review-invalid" ? (
          <p className="mb-4 text-sm font-medium text-destructive">{dictionary.reviewInvalid}</p>
        ) : null}
        {status === "request-accepted" ? (
          <p className="mb-4 text-sm font-medium text-emerald-700">{dictionary.reviewAccepted}</p>
        ) : null}
        {status === "request-declined" ? (
          <p className="mb-4 text-sm font-medium text-emerald-700">{dictionary.reviewDeclined}</p>
        ) : null}
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.name}</TableHead>
                  <TableHead>{dictionary.email}</TableHead>
                  <TableHead>{dictionary.preferredDate}</TableHead>
                  <TableHead>{dictionary.message}</TableHead>
                  <TableHead>{dictionary.status}</TableHead>
                  <TableHead>{dictionary.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <p>{request.requesterName}</p>
                        {request.requesterPhone ? (
                          <p className="text-xs text-muted-foreground">
                            {dictionary.phone}: {request.requesterPhone}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{request.requesterEmail}</TableCell>
                    <TableCell>{request.preferredDate ?? ""}</TableCell>
                    <TableCell className="max-w-[20rem] text-sm text-muted-foreground">
                      {request.message ?? ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={request.status === "pending" ? "secondary" : "outline"}>
                        {getStatusLabel(request.status, dictionary)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === "pending" ? (
                        <div className="flex flex-wrap gap-2">
                          <form action={action}>
                            <input type="hidden" name="requestId" value={request.id} />
                            <input type="hidden" name="status" value="accepted" />
                            <Button type="submit" variant="outline" size="sm">
                              <CheckIcon className="h-4 w-4" />
                              {dictionary.accept}
                            </Button>
                          </form>
                          <form action={action}>
                            <input type="hidden" name="requestId" value={request.id} />
                            <input type="hidden" name="status" value="declined" />
                            <Button type="submit" variant="secondary" size="sm">
                              <XIcon className="h-4 w-4" />
                              {dictionary.decline}
                            </Button>
                          </form>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              previousHref={previousHref}
              nextHref={nextHref}
              dictionary={dictionary}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
