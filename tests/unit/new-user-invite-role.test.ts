import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("new user invite role", () => {
  it("removes the trigger-added trainee role when another role was selected", () => {
    const service = fs.readFileSync(
      path.join(process.cwd(), "server/services/user-management.service.ts"),
      "utf8"
    );

    expect(service).toContain('if (!existingUser && input.role !== "apprentice")');
    expect(service).toContain(
      'removeRoleFromUser(supabase, actorUserId, targetUserId, "apprentice")'
    );
  });
});
