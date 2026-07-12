import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import type { Json } from "@/types/database";

export type SubmissionMetadataInput = {
  deviceId?: string | null;
  deviceMetadata?: string | null;
};

export type SubmissionMetadata = {
  ip: string | null;
  userAgent: string | null;
  deviceId: string | null;
  acceptLanguage: string | null;
  referrer: string | null;
  metadata: Json;
};

function truncate(value: string | null, maxLength: number) {
  return value ? value.slice(0, maxLength) : null;
}

function parseDeviceMetadata(value: string | null | undefined): Json {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Json
      : {};
  } catch {
    return {};
  }
}

function getFirstForwardedIp(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

export function getSubmissionMetadata(
  headerList: ReadonlyHeaders,
  input: SubmissionMetadataInput
): SubmissionMetadata {
  const xForwardedFor = headerList.get("x-forwarded-for");
  const cfConnectingIp = headerList.get("cf-connecting-ip");
  const xRealIp = headerList.get("x-real-ip");
  const forwarded = headerList.get("forwarded");
  const ip = getFirstForwardedIp(xForwardedFor) ?? cfConnectingIp ?? xRealIp;

  return {
    ip: truncate(ip, 255),
    userAgent: truncate(headerList.get("user-agent"), 1000),
    deviceId: truncate(input.deviceId ?? null, 128),
    acceptLanguage: truncate(headerList.get("accept-language"), 255),
    referrer: truncate(headerList.get("referer") ?? headerList.get("referrer"), 1000),
    metadata: {
      device: parseDeviceMetadata(input.deviceMetadata),
      request: {
        origin: truncate(headerList.get("origin"), 1000),
        host: truncate(headerList.get("host"), 255),
        forwarded: truncate(forwarded, 1000),
        xForwardedFor: truncate(xForwardedFor, 1000),
        xRealIp: truncate(xRealIp, 255),
        cfConnectingIp: truncate(cfConnectingIp, 255),
      },
    } satisfies Json,
  };
}
