import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { downloadDigitalCertificate } from "@/server/services/certificate.service";

const paramsSchema = z.object({ certificateId: z.string().uuid() });

export async function GET(
  _request: Request,
  context: { params: Promise<{ certificateId: string }> }
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const certificate = await downloadDigitalCertificate(supabase, user.id, parsed.data.certificateId);
    return new Response(Buffer.from(certificate.bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${certificate.certificateNumber}.pdf"`,
        "Content-Length": String(certificate.bytes.byteLength),
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Certificate download is not authorized or unavailable." }, { status: 403 });
  }
}
