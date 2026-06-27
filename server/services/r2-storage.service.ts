import crypto from "node:crypto";
import { getR2Env } from "@/lib/env";

export const MAX_AVATAR_UPLOAD_BYTES = 2 * 1024 * 1024;

export type AvatarUploadValidationResult =
  | { ok: true }
  | { ok: false; code: "avatar-type" | "avatar-size" };

export type AvatarUploadResult =
  | { ok: true; url: string }
  | {
      ok: false;
      code:
        | "avatar-type"
        | "avatar-size"
        | "avatar-config"
        | "avatar-auth"
        | "avatar-bucket"
        | "avatar-upload";
    };

type R2UploadConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

function hmac(key: crypto.BinaryLike, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256Hex(value: crypto.BinaryLike) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getSignatureKey(secretAccessKey: string, dateStamp: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");

  return hmac(serviceKey, "aws4_request");
}

function getR2Config(): R2UploadConfig | null {
  try {
    const env = getR2Env();

    return {
      accountId: env.CLOUDFLARE_R2_ACCOUNT_ID,
      accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      bucket: env.CLOUDFLARE_R2_BUCKET,
      publicUrl: env.CLOUDFLARE_R2_PUBLIC_URL.replace(/\/$/, ""),
    };
  } catch (error) {
    console.error("Cloudflare R2 avatar config is invalid.", error);

    return null;
  }
}

function getUploadErrorCode(status: number): Exclude<AvatarUploadResult, { ok: true }>["code"] {
  if (status === 401 || status === 403) {
    return "avatar-auth";
  }

  if (status === 404) {
    return "avatar-bucket";
  }

  return "avatar-upload";
}

export function createR2AuthorizationHeader({
  accessKeyId,
  credentialScope,
  signedHeaders,
  signature,
}: {
  accessKeyId: string;
  credentialScope: string;
  signedHeaders: string;
  signature: string;
}) {
  return [
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");
}

function encodeKeyPath(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function getAmzDates(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");

  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

export function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "size" in value &&
    "type" in value
  );
}

export function validateAvatarUploadFile(file: File): AvatarUploadValidationResult {
  const hasJpegType = file.type === "image/jpeg";
  const hasJpegName = /\.jpe?g$/i.test(file.name);

  if (!hasJpegType || !hasJpegName) {
    return { ok: false, code: "avatar-type" };
  }

  if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
    return { ok: false, code: "avatar-size" };
  }

  return { ok: true };
}

export async function uploadPractitionerAvatar(userId: string, file: File): Promise<AvatarUploadResult> {
  const validation = validateAvatarUploadFile(file);

  if (!validation.ok) {
    return validation;
  }

  try {
    const config = getR2Config();

    if (!config) {
      return { ok: false, code: "avatar-config" };
    }

    const body = Buffer.from(await file.arrayBuffer());
    const payloadHash = sha256Hex(body);
    const key = `avatars/${userId}/${Date.now()}-${crypto.randomUUID()}.jpg`;
    const encodedKey = encodeKeyPath(key);
    const url = new URL(
      `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${encodedKey}`
    );
    const { amzDate, dateStamp } = getAmzDates();
    const canonicalUri = url.pathname;
    const canonicalHeaders = [
      `host:${url.host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
      "",
    ].join("\n");
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = [
      "PUT",
      canonicalUri,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");
    const signature = crypto
      .createHmac("sha256", getSignatureKey(config.secretAccessKey, dateStamp))
      .update(stringToSign)
      .digest("hex");
    const authorization = createR2AuthorizationHeader({
      accessKeyId: config.accessKeyId,
      credentialScope,
      signedHeaders,
      signature,
    });

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: authorization,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/jpeg",
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
      },
      body,
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");

      console.error("Cloudflare R2 avatar upload failed.", {
        status: response.status,
        statusText: response.statusText,
        bucket: config.bucket,
        key,
        responseBody: responseBody.slice(0, 500),
      });

      return { ok: false, code: getUploadErrorCode(response.status) };
    }

    return {
      ok: true,
      url: `${config.publicUrl}/${key}`,
    };
  } catch (error) {
    console.error("Cloudflare R2 avatar upload threw an exception.", error);

    return { ok: false, code: "avatar-upload" };
  }
}
