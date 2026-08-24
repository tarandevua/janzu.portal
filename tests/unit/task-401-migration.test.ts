import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202608240001_task_401_training_history_read_model.sql"
  ),
  "utf8"
);
const integrationTest = readFileSync(
  resolve(process.cwd(), "supabase/tests/task_401_training_history.sql"),
  "utf8"
);

describe("TASK-401 migration", () => {
  it("binds the read actor and scopes Instructor access to active relationships", () => {
    expect(migration).toContain("actor_user_id is distinct from auth.uid()");
    expect(migration).toContain(
      "public.is_active_instructor_for(actor_user_id, target_trainee_user_id)"
    );
    expect(migration).toContain("public.user_has_role(actor_user_id, 'admin')");
  });

  it("keeps private fields in an authenticated read model", () => {
    expect(migration).toContain("evidence_reference text");
    expect(migration).toContain("notes text");
    expect(migration).toContain("verified_by_name text");
    expect(migration).toContain(
      "revoke all on function public.list_training_history(uuid, uuid) from public, anon"
    );
    expect(migration).toContain(
      "grant execute on function public.list_training_history(uuid, uuid) to authenticated"
    );
  });

  it("covers unverified derivation and denied actor, relationship, and anonymous access", () => {
    expect(integrationTest).toContain("Unverified training changed the derived current level");
    expect(integrationTest).toContain("A caller changed the actor identifier");
    expect(integrationTest).toContain("A former Instructor retained training-history access");
    expect(integrationTest).toContain("Anonymous caller read private training history");
  });
});
