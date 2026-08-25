import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/202608250001_add_level_3_training.sql"),
  "utf8"
).toLowerCase();

describe("Level 3 training migration", () => {
  it("adds Level 3 and ranks it above the existing levels", () => {
    expect(migration).toContain("add value if not exists 'level_3'");
    expect(migration).toContain("when 'level_3' then 3");
    expect(migration).toContain("when 'level_2' then 2");
  });
});
