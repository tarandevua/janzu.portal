import { NextResponse } from "next/server";
import { fetchPrivateR2ImageObject } from "@/server/services/r2-storage.service";

type R2MediaRouteProps = {
  params: Promise<{ key: string[] }>;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handleR2MediaRequest({ params }: R2MediaRouteProps, includeBody: boolean) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");
  const result = await fetchPrivateR2ImageObject(key);

  if (!result.ok) {
    return NextResponse.json(
      { data: null, error: { message: result.message } },
      { status: result.status }
    );
  }

  const headers = new Headers({
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    "Content-Type": result.contentType,
  });

  if (result.contentLength) {
    headers.set("Content-Length", result.contentLength);
  }

  if (result.etag) {
    headers.set("ETag", result.etag);
  }

  return new Response(includeBody ? result.response.body : null, {
    status: 200,
    headers,
  });
}

export async function GET(_request: Request, context: R2MediaRouteProps) {
  return handleR2MediaRequest(context, true);
}

export async function HEAD(_request: Request, context: R2MediaRouteProps) {
  return handleR2MediaRequest(context, false);
}
