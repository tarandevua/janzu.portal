import { type NextRequest } from "next/server";
import {
  listReviewerLocations,
  reviewSubmittedLocation,
} from "@/server/controllers/location.controller";

export async function GET() {
  return listReviewerLocations();
}

export async function POST(request: NextRequest) {
  return reviewSubmittedLocation(request);
}
