import { type NextRequest } from "next/server";
import {
  createCurrentUserClient,
  listCurrentUserClients,
} from "@/server/controllers/client.controller";

export async function GET() {
  return listCurrentUserClients();
}

export async function POST(request: NextRequest) {
  return createCurrentUserClient(request);
}
