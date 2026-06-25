import { type NextRequest } from "next/server";
import {
  getCurrentPractitionerProfile,
  updateCurrentPractitionerProfile,
} from "@/server/controllers/practitioner.controller";

export async function GET() {
  return getCurrentPractitionerProfile();
}

export async function PUT(request: NextRequest) {
  return updateCurrentPractitionerProfile(request);
}
