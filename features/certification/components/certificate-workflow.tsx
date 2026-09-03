import React from "react";
import type { Locale } from "@/lib/i18n/config";
import type { CertificateStatus, CertificateWorkflowItem } from "@/server/models/certification.model";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  decideCertificateAppealAction,
  issueCertificateAction,
  rejectCertificateReplacementAction,
  replaceCertificateAction,
  requestCertificateReplacementAction,
  revokeCertificateAction,
  submitCertificateAppealAction,
} from "@/features/certification/actions";

type CertificateDictionary = {
  certificateTitle: string; certificateDescription: string; certificateEmpty: string;
  templateUnavailableTitle: string; templateUnavailableDescription: string;
  member: string; certificateNumber: string; certificateName: string; certificateStatus: string;
  originalCertificationDate: string; issuedDate: string; revokedDate: string;
  issueCertificate: string; downloadCertificate: string; replaceCertificate: string;
  replacementReason: string; replacementReasonPlaceholder: string; rejectReplacement: string;
  revokeCertificate: string; revocationReason: string; revocationReasonPlaceholder: string;
  evidenceReference: string; evidenceReferencePlaceholder: string;
  requestReplacement: string; nameMismatchTitle: string; nameMismatchDescription: string;
  replacementPending: string; replacementRejected: string;
  appealTitle: string; appealReason: string; appealReasonPlaceholder: string; submitAppeal: string;
  appealPending: string; appealUpheld: string; appealReinstated: string;
  upholdAppeal: string; reinstateCertification: string; appealDecisionReason: string;
  noCertificate: string; privacyNotice: string;
  statuses: Record<CertificateStatus, string>;
  statusMessages: Record<string, string>;
};

export function CertificateWorkflow({
  locale,
  items,
  status,
  dictionary,
}: {
  locale: Locale;
  items: CertificateWorkflowItem[];
  status?: string;
  dictionary: CertificateDictionary;
}) {
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const statusMessage = status ? dictionary.statusMessages[status] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.certificateTitle}</CardTitle>
        <CardDescription>{dictionary.certificateDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {statusMessage ? <Alert><AlertDescription>{statusMessage}</AlertDescription></Alert> : null}
        {items.length === 0 ? <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">{dictionary.certificateEmpty}</div> : null}
        {items.map((item) => (
          <section key={item.journeyId} className="grid gap-4 rounded-md border p-4" id={item.certificateId ? `certificate-${item.certificateId}` : `certificate-journey-${item.journeyId}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.memberName}</p>
                <p className="text-sm text-muted-foreground">{item.certificateNumber ?? dictionary.noCertificate}</p>
              </div>
              {item.certificateStatus ? <Badge variant={item.certificateStatus === "active" ? "default" : "secondary"}>{dictionary.statuses[item.certificateStatus]}</Badge> : null}
            </div>

            {item.certificateId ? (
              <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-muted-foreground">{dictionary.certificateName}</dt><dd>{item.certificateNameSnapshot}</dd></div>
                <div><dt className="text-muted-foreground">{dictionary.originalCertificationDate}</dt><dd>{item.originalCertificationDate ? formatter.format(new Date(`${item.originalCertificationDate}T00:00:00Z`)) : "-"}</dd></div>
                <div><dt className="text-muted-foreground">{dictionary.issuedDate}</dt><dd>{item.issuedAt ? formatter.format(new Date(item.issuedAt)) : "-"}</dd></div>
                {item.revokedAt ? <div><dt className="text-muted-foreground">{dictionary.revokedDate}</dt><dd>{formatter.format(new Date(item.revokedAt))}</dd></div> : null}
              </dl>
            ) : null}

            {!item.templateReady && (item.canIssue || item.canReplace || item.canDecideAppeal) ? (
              <Alert>
                <p className="font-medium">{dictionary.templateUnavailableTitle}</p>
                <AlertDescription>{dictionary.templateUnavailableDescription}</AlertDescription>
              </Alert>
            ) : null}

            {item.nameMismatch ? (
              <Alert>
                <p className="font-medium">{dictionary.nameMismatchTitle}</p>
                <AlertDescription>{dictionary.nameMismatchDescription}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {item.canDownload && item.certificateId ? (
                <Button asChild><a href={`/api/certificates/${item.certificateId}/download`}>{dictionary.downloadCertificate}</a></Button>
              ) : null}
              {item.canIssue ? (
                <form action={issueCertificateAction.bind(null, locale)}>
                  <input type="hidden" name="journeyId" value={item.journeyId} />
                  <Button type="submit" disabled={!item.templateReady}>{dictionary.issueCertificate}</Button>
                </form>
              ) : null}
            </div>

            {item.canRequestReplacement && item.certificateId ? (
              <form action={requestCertificateReplacementAction.bind(null, locale)} className="grid gap-3 rounded-md border p-4">
                <input type="hidden" name="certificateId" value={item.certificateId} />
                <Label htmlFor={`replacement-request-${item.certificateId}`}>{dictionary.replacementReason}</Label>
                <Textarea id={`replacement-request-${item.certificateId}`} name="reason" minLength={10} maxLength={1000} required placeholder={dictionary.replacementReasonPlaceholder} />
                <Button type="submit" variant="outline">{dictionary.requestReplacement}</Button>
              </form>
            ) : null}

            {item.replacementRequestStatus === "pending" ? (
              <Alert><AlertDescription>{dictionary.replacementPending}</AlertDescription></Alert>
            ) : item.replacementRequestStatus === "rejected" ? (
              <Alert><AlertDescription>{dictionary.replacementRejected}</AlertDescription></Alert>
            ) : null}

            {item.canReplace && item.certificateId ? (
              <form action={replaceCertificateAction.bind(null, locale)} className="grid gap-3 rounded-md border p-4">
                <input type="hidden" name="certificateId" value={item.certificateId} />
                <input type="hidden" name="requestId" value={item.replacementRequestStatus === "pending" ? item.replacementRequestId ?? "" : ""} />
                <Label htmlFor={`replacement-reason-${item.certificateId}`}>{dictionary.replacementReason}</Label>
                <Textarea id={`replacement-reason-${item.certificateId}`} name="reason" minLength={10} maxLength={1000} required defaultValue={item.replacementRequestReason ?? ""} placeholder={dictionary.replacementReasonPlaceholder} />
                <Button type="submit" disabled={!item.templateReady}>{dictionary.replaceCertificate}</Button>
              </form>
            ) : null}

            {item.replacementRequestStatus === "pending" && item.replacementRequestId && item.canReplace ? (
              <form action={rejectCertificateReplacementAction.bind(null, locale)} className="grid gap-3 rounded-md border p-4">
                <input type="hidden" name="requestId" value={item.replacementRequestId} />
                <Label htmlFor={`replacement-rejection-${item.replacementRequestId}`}>{dictionary.replacementReason}</Label>
                <Textarea id={`replacement-rejection-${item.replacementRequestId}`} name="reason" minLength={10} maxLength={1000} required />
                <Button type="submit" variant="outline">{dictionary.rejectReplacement}</Button>
              </form>
            ) : null}

            {item.canRevoke && item.certificateId ? (
              <form action={revokeCertificateAction.bind(null, locale)} className="grid gap-3 rounded-md border border-destructive/40 p-4">
                <input type="hidden" name="certificateId" value={item.certificateId} />
                <Label htmlFor={`revocation-reason-${item.certificateId}`}>{dictionary.revocationReason}</Label>
                <Textarea id={`revocation-reason-${item.certificateId}`} name="reason" minLength={10} maxLength={1000} required placeholder={dictionary.revocationReasonPlaceholder} />
                <Label htmlFor={`revocation-evidence-${item.certificateId}`}>{dictionary.evidenceReference}</Label>
                <Input id={`revocation-evidence-${item.certificateId}`} name="evidenceReference" minLength={3} maxLength={1000} required placeholder={dictionary.evidenceReferencePlaceholder} />
                <Button type="submit" variant="destructive">{dictionary.revokeCertificate}</Button>
              </form>
            ) : null}

            {item.canSubmitAppeal && item.certificateId ? (
              <form action={submitCertificateAppealAction.bind(null, locale)} className="grid gap-3 rounded-md border p-4">
                <input type="hidden" name="certificateId" value={item.certificateId} />
                <Label htmlFor={`appeal-reason-${item.certificateId}`}>{dictionary.appealReason}</Label>
                <Textarea id={`appeal-reason-${item.certificateId}`} name="reason" minLength={10} maxLength={2000} required placeholder={dictionary.appealReasonPlaceholder} />
                <Label htmlFor={`appeal-evidence-${item.certificateId}`}>{dictionary.evidenceReference}</Label>
                <Input id={`appeal-evidence-${item.certificateId}`} name="evidenceReference" maxLength={1000} placeholder={dictionary.evidenceReferencePlaceholder} />
                <Button type="submit">{dictionary.submitAppeal}</Button>
              </form>
            ) : null}

            {item.appealStatus ? (
              <Alert><AlertDescription>{item.appealStatus === "pending" ? dictionary.appealPending : item.appealStatus === "upheld" ? dictionary.appealUpheld : dictionary.appealReinstated}</AlertDescription></Alert>
            ) : null}

            {item.canDecideAppeal && item.appealId ? (
              <form action={decideCertificateAppealAction.bind(null, locale)} className="grid gap-3 rounded-md border p-4">
                <input type="hidden" name="appealId" value={item.appealId} />
                <Label htmlFor={`appeal-decision-${item.appealId}`}>{dictionary.appealDecisionReason}</Label>
                <Textarea id={`appeal-decision-${item.appealId}`} name="reason" minLength={10} maxLength={2000} required />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" name="decision" value="upheld" variant="outline">{dictionary.upholdAppeal}</Button>
                  <Button type="submit" name="decision" value="reinstated" disabled={!item.templateReady}>{dictionary.reinstateCertification}</Button>
                </div>
              </form>
            ) : null}

            <p className="text-xs text-muted-foreground">{dictionary.privacyNotice}</p>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
