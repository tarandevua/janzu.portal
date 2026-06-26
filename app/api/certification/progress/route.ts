import { getCurrentCertificationProgress } from "@/server/controllers/certification.controller";

export async function GET() {
  return getCurrentCertificationProgress();
}
