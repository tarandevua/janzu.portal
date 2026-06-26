import { listCurrentUserLocations } from "@/server/controllers/location.controller";

export async function GET() {
  return listCurrentUserLocations();
}
