import { NextResponse } from "next/server";
import { fetchPrivateR2ImageObject } from "@/server/services/r2-storage.service";

type R2MediaRouteProps = {
  params: Promise<{ key: string[] }>;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: R2MediaRouteProps) {
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

  return new Response(result.response.body, {
    status: 200,
    headers,
  });
}
