import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Education private read truthfulness", () => {
  it("propagates private read failures instead of fabricating empty data", () => {
    const queries = read("src/core/education/services/education.queries.ts");

    for (const operation of [
      "Error fetching profile by id",
      "Error fetching profile by business_id",
      "Error listing programs",
      "Error fetching program by id",
      "Error listing leads",
      "Error fetching lead by id",
      "Error listing lead events",
      "Error listing events",
      "Error fetching event by id",
    ]) {
      expect(queries).toContain(
        `educationQueryError('${operation}', error)`,
      );
    }
  });

  it("exposes query failure state from private Education hooks", () => {
    for (const path of [
      "src/modules/business/education/hooks/useEducationPrograms.ts",
      "src/modules/business/education/hooks/useEducationLeads.ts",
      "src/modules/business/education/hooks/useLeadPipeline.ts",
      "src/modules/business/education/hooks/useEducationEvents.ts",
    ]) {
      const source = read(path);
      expect(source, path).toContain("isError:");
      expect(source, path).toContain("error:");
      expect(source, path).toContain("refetch:");
    }
  });

  it("renders an explicit retry state across active private pages", () => {
    const errorState = read(
      "src/modules/business/education/components/EducationAdminReadError.tsx",
    );
    expect(errorState).toContain("Nenhum estado vazio artificial foi exibido.");
    expect(errorState).toContain("Tentar novamente");

    for (const path of [
      "src/modules/business/education/pages/EducationDashboardPage.tsx",
      "src/modules/business/education/pages/EducationSetupPage.tsx",
      "src/modules/business/education/pages/EducationProgramsPage.tsx",
      "src/modules/business/education/pages/EducationLeadsPage.tsx",
      "src/modules/business/education/pages/EducationEventsPage.tsx",
      "src/modules/business/education/pages/EducationAnalyticsPage.tsx",
    ]) {
      expect(read(path), path).toContain("EducationAdminReadError");
    }
  });
});
