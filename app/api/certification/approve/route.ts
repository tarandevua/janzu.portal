import { type NextRequest } from "next/server";
import {
  approveCertification,
  listCertificationApprovalQueue,
} from "@/server/controllers/certification.controller";

export async function GET() {
  return listCertificationApprovalQueue();
}

export async function POST(request: NextRequest) {
  return approveCertification(request);
}
