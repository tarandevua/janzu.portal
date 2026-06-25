import { listPublicPractitioners } from "@/server/controllers/practitioner.controller";

export async function GET() {
  return listPublicPractitioners();
}
