import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("G6 Education event datetime integrity", () => {
  it("converts datetime-local values explicitly before timestamptz writes", () => {
    const page = readFileSync(
      join(
        ROOT,
        "src/modules/business/education/pages/EducationEventsPage.tsx",
      ),
      "utf8",
    );

    expect(page).toContain("fromLocalInputToEventIso(formData.startsAt)");
    expect(page).toContain("fromEventIsoToLocalInput(event.starts_at)");
    expect(page).not.toContain("event.starts_at.slice(0, 16)");
  });

  it("does not mutate the React Query events array when sorting", () => {
    const page = readFileSync(
      join(
        ROOT,
        "src/modules/business/education/pages/EducationEventsPage.tsx",
      ),
      "utf8",
    );

    expect(page).toContain("{[...events]");
    expect(page).not.toContain("{events\n            .sort");
  });
});
