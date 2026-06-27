import crypto from "node:crypto";
import { getR2Env } from "@/lib/env";
import { getR2MediaUrl } from "@/lib/r2-media";

export const MAX_AVATAR_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_LOCATION_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_LOCATION_IMAGE_UPLOADS = 6;

export type AvatarUploadValidationResult =
  | { ok: true }
  | { ok: false; code: "avatar-type" | "avatar-size" };

export type LocationImageUploadValidationResult =
  | { ok: true }
  | { ok: false; code: "location-image-type" | "location-image-size" | "location-image-count" };

export type AvatarUploadResult =
  | { ok: true; key: string; url: string }
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

export type LocationImageUploadResult =
  | { ok: true; key: string; url: string }
  | {
      ok: false;
      code:
        | "location-image-type"
        | "location-image-size"
        | "location-image-count"
        | "location-image-config"
        | "location-image-auth"
        | "location-image-bucket"
        | "location-image-upload"
    };

type R2UploadConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

export type R2ImageFetchResult =
  | { ok: true; response: Response; contentType: string; contentLength: string | null; etag: string | null }
  | { ok: false; status: number; message: string };

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
    };
  } catch (error) {
    console.error("Cloudflare R2 avatar config is invalid.", error);

    return null;
  }
}

function createR2ObjectUrl(config: R2UploadConfig, key: string) {
  return new URL(
    `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${encodeKeyPath(key)}`
  );
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

function getLocationImageUploadErrorCode(
  status: number
): Exclude<LocationImageUploadResult, { ok: true }>["code"] {
  if (status === 401 || status === 403) {
    return "location-image-auth";
  }

  if (status === 404) {
    return "location-image-bucket";
  }

  return "location-image-upload";
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

export function isAllowedR2ImageKey(key: string) {
  const keyParts = key.split("/");

  return (
    (key.startsWith("avatars/") || key.startsWith("locations/")) &&
    !key.includes("..") &&
    keyParts.length >= 3 &&
    !keyParts.some((part) => part.trim() === "") &&
    /\.jpe?g$/i.test(key)
  );
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

function hasJpegSignature(fileBytes: Uint8Array) {
  return fileBytes.length >= 3 && fileBytes[0] === 0xff && fileBytes[1] === 0xd8 && fileBytes[2] === 0xff;
}

export function validateLocationImageUploadFiles(files: File[]): LocationImageUploadValidationResult {
  if (files.length > MAX_LOCATION_IMAGE_UPLOADS) {
    return { ok: false, code: "location-image-count" };
  }

  for (const file of files) {
    const hasJpegType = file.type === "image/jpeg";
    const hasJpegName = /\.jpe?g$/i.test(file.name);

    if (!hasJpegType || !hasJpegName) {
      return { ok: false, code: "location-image-type" };
    }

    if (file.size > MAX_LOCATION_IMAGE_UPLOAD_BYTES) {
      return { ok: false, code: "location-image-size" };
    }
  }

  return { ok: true };
}

function createSignedR2RequestHeaders({
  config,
  method,
  url,
  payloadHash,
}: {
  config: R2UploadConfig;
  method: "GET" | "PUT";
  url: URL;
  payloadHash: string;
}) {
  const { amzDate, dateStamp } = getAmzDates();
  const canonicalHeaders = [
    `host:${url.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    "",
  ].join("\n");
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method,
    url.pathname,
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

  return {
    Authorization: createR2AuthorizationHeader({
      accessKeyId: config.accessKeyId,
      credentialScope,
      signedHeaders,
      signature,
    }),
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
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
    const url = createR2ObjectUrl(config, key);
    const signedHeaders = createSignedR2RequestHeaders({
      config,
      method: "PUT",
      url,
      payloadHash,
    });

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        ...signedHeaders,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/jpeg",
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
      key,
      url: getR2MediaUrl(key),
    };
  } catch (error) {
    console.error("Cloudflare R2 avatar upload threw an exception.", error);

    return { ok: false, code: "avatar-upload" };
  }
}

export async function uploadLocationImage({
  locationId,
  file,
  sortOrder,
}: {
  locationId: string;
  file: File;
  sortOrder: number;
}): Promise<LocationImageUploadResult> {
  const validation = validateLocationImageUploadFiles([file]);

  if (!validation.ok) {
    return validation;
  }

  try {
    const config = getR2Config();

    if (!config) {
      return { ok: false, code: "location-image-config" };
    }

    const body = Buffer.from(await file.arrayBuffer());

    if (!hasJpegSignature(body)) {
      return { ok: false, code: "location-image-type" };
    }

    const payloadHash = sha256Hex(body);
    const key = `locations/${locationId}/${sortOrder}-${Date.now()}-${crypto.randomUUID()}.jpg`;
    const url = createR2ObjectUrl(config, key);
    const signedHeaders = createSignedR2RequestHeaders({
      config,
      method: "PUT",
      url,
      payloadHash,
    });

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        ...signedHeaders,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/jpeg",
      },
      body,
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");

      console.error("Cloudflare R2 location image upload failed.", {
        status: response.status,
        statusText: response.statusText,
        bucket: config.bucket,
        key,
        responseBody: responseBody.slice(0, 500),
      });

      return { ok: false, code: getLocationImageUploadErrorCode(response.status) };
    }

    return {
      ok: true,
      key,
      url: getR2MediaUrl(key),
    };
  } catch (error) {
    console.error("Cloudflare R2 location image upload threw an exception.", error);

    return { ok: false, code: "location-image-upload" };
  }
}

export async function fetchPrivateR2ImageObject(key: string): Promise<R2ImageFetchResult> {
  if (!isAllowedR2ImageKey(key)) {
    return { ok: false, status: 400, message: "Invalid media key." };
  }

  const config = getR2Config();

  if (!config) {
    return { ok: false, status: 503, message: "Media storage is not configured." };
  }

  try {
    const payloadHash = sha256Hex("");
    const url = createR2ObjectUrl(config, key);
    const response = await fetch(url, {
      method: "GET",
      headers: createSignedR2RequestHeaders({
        config,
        method: "GET",
        url,
        payloadHash,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status === 404 ? 404 : 502,
        message: response.status === 404 ? "Media object was not found." : "Media object could not be fetched.",
      };
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    if (contentType !== "image/jpeg") {
      return { ok: false, status: 415, message: "Media object type is not supported." };
    }

    return {
      ok: true,
      response,
      contentType,
      contentLength: response.headers.get("content-length"),
      etag: response.headers.get("etag"),
    };
  } catch (error) {
    console.error("Cloudflare R2 private image fetch failed.", error);

    return { ok: false, status: 502, message: "Media object could not be fetched." };
  }
}
