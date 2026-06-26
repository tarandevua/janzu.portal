import { getBasicHealth } from "@/server/controllers/health.controller";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return getBasicHealth();
}
