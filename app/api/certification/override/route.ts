import { type NextRequest } from "next/server";
import { overrideCertification } from "@/server/controllers/certification.controller";

export async function POST(request: NextRequest) {
  return overrideCertification(request);
}
