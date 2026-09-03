import "server-only";

import crypto from "node:crypto";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import { getClientEnv } from "@/lib/env";
import {
  authorizeCertificateDownload,
  commitCertificateIssuance,
  commitCertificateReplacement,
  commitCertificateReinstatement,
  getCertificateGenerationContext,
  listCertificateWorkflow,
  rejectCertificateReplacementRecord,
  requestCertificateReplacementRecord,
  revokeCertificateRecord,
  submitCertificateAppealRecord,
  upholdCertificateAppealRecord,
  verifyCertificateNumber,
} from "@/server/repositories/certification.repository";
import type { CertificateGenerationContext, PreparedCertificateArtifact } from "@/server/models/certification.model";
import { generateCertificateNumber } from "@/server/services/certificate-number";
import { generateCertificatePdf, sha256Bytes } from "@/server/services/certificate-pdf.service";
import {
  deletePrivateCertificateObject,
  fetchPrivateCertificateObject,
  uploadPrivateCertificateObject,
} from "@/server/services/r2-storage.service";

export class CertificateTemplateNotConfiguredError extends Error {
  constructor() {
    super("The production certificate template is not configured.");
    this.name = "CertificateTemplateNotConfiguredError";
  }
}

async function readApprovedSignature(path: string, expectedSha256: string) {
  const result = await fetchPrivateCertificateObject(path);
  if (!result.ok) throw new CertificateTemplateNotConfiguredError();
  const bytes = new Uint8Array(await result.response.arrayBuffer());
  if (sha256Bytes(bytes) !== expectedSha256) throw new CertificateTemplateNotConfiguredError();
  return bytes;
}

async function prepareCertificateArtifact(context: CertificateGenerationContext) {
  if (
    !context.templateReady ||
    !context.officialName ||
    !context.signatoryOneObjectPath ||
    !context.signatoryTwoObjectPath ||
    !context.signatoryOneSha256 ||
    !context.signatoryTwoSha256
  ) {
    throw new CertificateTemplateNotConfiguredError();
  }

  const [signatureOne, signatureTwo] = await Promise.all([
    readApprovedSignature(context.signatoryOneObjectPath, context.signatoryOneSha256),
    readApprovedSignature(context.signatoryTwoObjectPath, context.signatoryTwoSha256),
  ]);
  const certificateId = crypto.randomUUID();
  const issuedAt = new Date();
  const certificateNumber = generateCertificateNumber(issuedAt);
  const siteUrl = getClientEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const verificationUrl = `${siteUrl}/en/certificates/verify/${encodeURIComponent(certificateNumber)}`;
  const pdf = await generateCertificatePdf({
    officialName: context.officialName,
    certificateNumber,
    originalCertificationDate: new Date(`${context.originalCertificationDate}T00:00:00.000Z`),
    documentIssuedAt: issuedAt,
    issuerName: context.issuerName,
    templateVersion: context.templateVersion,
    verificationUrl,
    signatoryOne: { name: context.signatoryOneName, png: signatureOne },
    signatoryTwo: { name: context.signatoryTwoName, png: signatureTwo },
  });
  const objectPath = `certificates/${context.memberUserId}/${certificateId}.pdf`;
  const upload = await uploadPrivateCertificateObject(objectPath, pdf, "application/pdf");
  if (!upload.ok) throw new Error(`Certificate artifact upload failed: ${upload.code}`);

  return {
    artifact: {
      certificateId,
      certificateNumber,
      objectPath,
      sha256: upload.sha256,
      sizeBytes: upload.sizeBytes,
      templateId: context.templateId,
      signatoryOneSha256: context.signatoryOneSha256,
      signatoryTwoSha256: context.signatoryTwoSha256,
    } satisfies PreparedCertificateArtifact,
    objectPath,
  };
}

async function commitPreparedArtifact<T>(
  prepared: Awaited<ReturnType<typeof prepareCertificateArtifact>>,
  commit: (artifact: PreparedCertificateArtifact) => Promise<T>
) {
  try {
    return await commit(prepared.artifact);
  } catch (error) {
    await deletePrivateCertificateObject(prepared.objectPath).catch((cleanupError) => {
      console.error("Certificate orphan cleanup failed.", {
        objectPath: prepared.objectPath,
        error: cleanupError instanceof Error ? cleanupError.message : "unknown",
      });
    });
    throw error;
  }
}

export { listCertificateWorkflow, verifyCertificateNumber };

export async function issueDigitalCertificate(
  supabase: SupabaseServerClient,
  actorUserId: string,
  journeyId: string
) {
  const context = await getCertificateGenerationContext(supabase, actorUserId, "issue", { journeyId });
  const prepared = await prepareCertificateArtifact(context);
  return commitPreparedArtifact(prepared, (artifact) =>
    commitCertificateIssuance(supabase, actorUserId, journeyId, artifact)
  );
}

export async function replaceDigitalCertificate(
  supabase: SupabaseServerClient,
  actorUserId: string,
  certificateId: string,
  reason: string,
  requestId: string | null
) {
  const context = await getCertificateGenerationContext(supabase, actorUserId, "replace", { certificateId });
  const prepared = await prepareCertificateArtifact(context);
  return commitPreparedArtifact(prepared, (artifact) =>
    commitCertificateReplacement(supabase, actorUserId, certificateId, reason, requestId, artifact)
  );
}

export async function reinstateDigitalCertificate(
  supabase: SupabaseServerClient,
  actorUserId: string,
  appealId: string,
  reason: string
) {
  const context = await getCertificateGenerationContext(supabase, actorUserId, "reinstate", { appealId });
  const prepared = await prepareCertificateArtifact(context);
  return commitPreparedArtifact(prepared, (artifact) =>
    commitCertificateReinstatement(supabase, actorUserId, appealId, reason, artifact)
  );
}

export const revokeDigitalCertificate = revokeCertificateRecord;
export const requestDigitalCertificateReplacement = requestCertificateReplacementRecord;
export const rejectDigitalCertificateReplacement = rejectCertificateReplacementRecord;
export const submitDigitalCertificateAppeal = submitCertificateAppealRecord;
export const upholdDigitalCertificateAppeal = upholdCertificateAppealRecord;

export async function downloadDigitalCertificate(
  supabase: SupabaseServerClient,
  actorUserId: string,
  certificateId: string
) {
  const authorization = await authorizeCertificateDownload(supabase, actorUserId, certificateId);
  const object = await fetchPrivateCertificateObject(authorization.artifact_object_path);
  if (!object.ok) throw new Error(object.message);
  const bytes = new Uint8Array(await object.response.arrayBuffer());
  if (bytes.byteLength !== authorization.artifact_size_bytes || sha256Bytes(bytes) !== authorization.artifact_sha256) {
    throw new Error("Certificate artifact integrity verification failed.");
  }
  return { bytes, certificateNumber: authorization.certificate_number };
}
