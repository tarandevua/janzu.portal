import { type NextRequest } from "next/server";
import {
  createCurrentUserLocation,
  listApprovedPublicLocations,
} from "@/server/controllers/location.controller";

export async function GET() {
  return listApprovedPublicLocations();
}

export async function POST(request: NextRequest) {
  return createCurrentUserLocation(request);
}
