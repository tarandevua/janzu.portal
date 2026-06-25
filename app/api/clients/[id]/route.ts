import { type NextRequest } from "next/server";
import {
  deleteCurrentUserClient,
  updateCurrentUserClient,
} from "@/server/controllers/client.controller";

type ClientRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: ClientRouteContext) {
  const { id } = await context.params;
  return updateCurrentUserClient(request, id);
}

export async function DELETE(_request: NextRequest, context: ClientRouteContext) {
  const { id } = await context.params;
  return deleteCurrentUserClient(id);
}
