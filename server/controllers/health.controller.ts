import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  checkSupabaseReadiness,
  createBasicHealthPayload,
  createDetailedHealthPayload,
} from "@/server/services/health.service";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export function getBasicHealth() {
  return NextResponse.json(createBasicHealthPayload(), {
    headers: NO_STORE_HEADERS,
  });
}

export async function getDetailedHealth() {
  const payload = await createDetailedHealthPayload({
    supabaseCheck: async () => {
      const supabase = await createSupabaseServerClient();
      return checkSupabaseReadiness(supabase);
    },
  });

  return NextResponse.json(payload, {
    status: payload.status === "ok" ? 200 : 503,
    headers: NO_STORE_HEADERS,
  });
}
