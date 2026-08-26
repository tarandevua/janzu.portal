import { listCertificationJourneyQueue } from "@/server/controllers/certification.controller";

export async function GET() {
  return listCertificationJourneyQueue();
}
