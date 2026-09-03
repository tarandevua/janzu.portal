import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import { CertificateWorkflow } from "@/features/certification/components/certificate-workflow";
import type { CertificateWorkflowItem } from "@/server/models/certification.model";
import { generateCertificateNumber, isCertificateNumber, normalizeCertificateNumber } from "@/server/services/certificate-number";
import { generateCertificatePdf, sha256Bytes } from "@/server/services/certificate-pdf.service";
import {
  certificateAppealDecisionSchema,
  certificateAppealSchema,
  certificateReplacementSchema,
  certificateRevocationSchema,
} from "@/server/validators/certification.schema";

const png = Uint8Array.from(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+lcD1WQAAAABJRU5ErkJggg==",
  "base64"
));

const item: CertificateWorkflowItem = {
  journeyId: "40500000-0000-4000-8000-000000000001",
  memberUserId: "40500000-0000-4000-8000-000000000002",
  memberName: "Certificate Member",
  currentOfficialName: "Certificate Member",
  journeyState: "assessment_passed",
  certificationStatus: "pending",
  assessmentId: "40500000-0000-4000-8000-000000000003",
  certificateId: null,
  certificateNumber: null,
  certificateStatus: null,
  certificateNameSnapshot: null,
  originalCertificationDate: null,
  issuedAt: null,
  lifecycleEffectiveAt: null,
  revokedAt: null,
  revocationReason: null,
  replacementRequestId: null,
  replacementRequestStatus: null,
  replacementRequestReason: null,
  appealId: null,
  appealStatus: null,
  appealReason: null,
  appealEvidenceReference: null,
  appealDecisionReason: null,
  templateReady: false,
  canIssue: true,
  canReplace: false,
  canRevoke: false,
  canRequestReplacement: false,
  canSubmitAppeal: false,
  canDecideAppeal: false,
  canDownload: false,
  nameMismatch: false,
};

describe("TASK-405 certificate lifecycle", () => {
  it("generates non-sequential normalized public certificate numbers", () => {
    const values = new Set(Array.from({ length: 100 }, () => generateCertificateNumber(new Date("2026-08-29T00:00:00Z"))));
    expect(values.size).toBe(100);
    for (const value of values) expect(isCertificateNumber(value)).toBe(true);
    const sample = [...values][0];
    expect(normalizeCertificateNumber(sample.toLowerCase().replaceAll("-", " "))).toBe(sample);
    expect(normalizeCertificateNumber("JZ-2026-short")).toBeNull();
  });

  it("generates a bilingual immutable PDF with a visible test-fixture watermark", async () => {
    const bytes = await generateCertificatePdf({
      officialName: "María Ejemplo",
      certificateNumber: "JZ-2026-7K9M-X4QP-2D8R",
      originalCertificationDate: new Date("2026-08-20T00:00:00Z"),
      documentIssuedAt: new Date("2026-08-29T00:00:00Z"),
      issuerName: "Escuela de Artes Acuáticas",
      templateVersion: "test-v1",
      verificationUrl: "https://portal.example/en/certificates/verify/JZ-2026-7K9M-X4QP-2D8R",
      signatoryOne: { name: "Maria Ornelas", png },
      signatoryTwo: { name: "Iván Gonzáles", png },
      testFixture: true,
    });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getTitle()).toContain("JZ-2026-7K9M-X4QP-2D8R");
    expect(pdf.getAuthor()).toBe("Escuela de Artes Acuáticas");
    expect(sha256Bytes(bytes)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("enforces lifecycle reasons and evidence at the server-validation boundary", () => {
    expect(certificateRevocationSchema.safeParse({ certificateId: crypto.randomUUID(), reason: "too short", evidenceReference: "x" }).success).toBe(false);
    expect(certificateAppealSchema.safeParse({ certificateId: crypto.randomUUID(), reason: "A documented appeal reason", evidenceReference: null }).success).toBe(true);
    expect(certificateAppealDecisionSchema.safeParse({ appealId: crypto.randomUUID(), decision: "reinstated", reason: "A documented decision reason" }).success).toBe(true);
    expect(certificateReplacementSchema.safeParse({ certificateId: crypto.randomUUID(), requestId: null, reason: "A documented replacement reason" }).success).toBe(true);
  });

  it("renders the production-template safety gate in English and Spanish", () => {
    const english = renderToStaticMarkup(<CertificateWorkflow locale="en" items={[item]} dictionary={en.certification} />);
    const spanish = renderToStaticMarkup(<CertificateWorkflow locale="es" items={[item]} dictionary={es.certification} />);
    expect(english).toContain("Certificate template not configured");
    expect(english).toContain("disabled");
    expect(spanish).toContain("Plantilla de certificado no configurada");
  });
});
