import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type CriticalFileBudget = {
  path: string;
  maxLines: number;
  severity: "error" | "warn";
};

const CRITICAL_FILE_BUDGETS: CriticalFileBudget[] = [
  { path: "src/core/profiles/services/ProfileService.ts", maxLines: 2800, severity: "warn" },
  { path: "src/core/posts/services/PostService.ts", maxLines: 2400, severity: "warn" },
  { path: "src/core/professional/services/ProfessionalService.ts", maxLines: 1850, severity: "warn" },
  { path: "src/core/admin/services/AdminProfileGovernanceService.ts", maxLines: 1800, severity: "warn" },
  { path: "src/core/mobility/core/RideOperationalService.ts", maxLines: 1350, severity: "warn" },
  { path: "src/core/residence/components/ResidenceManager.tsx", maxLines: 180, severity: "error" },
  { path: "src/core/residence/hooks/useResidenceManager.ts", maxLines: 700, severity: "warn" },
  { path: "src/modules/admin/pages/AdminVagas.tsx", maxLines: 550, severity: "error" },
  { path: "src/modules/business/education/pages/EducationSetupPage.tsx", maxLines: 350, severity: "error" },
  { path: "src/modules/business/education/pages/EducationSetupSections.tsx", maxLines: 500, severity: "warn" },
  { path: "src/modules/business/gastronomy/pages/GastronomyDetailPage.tsx", maxLines: 350, severity: "error" },
  { path: "src/modules/professionals/services/pages/CadastrarServicoPage.tsx", maxLines: 350, severity: "error" },
  { path: "src/modules/professionals/services/pages/CadastrarServicoSteps.tsx", maxLines: 420, severity: "warn" },
  { path: "src/modules/classifieds/jobs/pages/PublicarVagaPage.tsx", maxLines: 650, severity: "error" },
];

function countLines(filePath: string): number {
  const absolutePath = resolve(process.cwd(), filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Critical file budget target not found: ${filePath}`);
  }
  const content = readFileSync(absolutePath, "utf8");
  return content.split(/\r?\n/).length;
}

function main() {
  const violations: Array<{ budget: CriticalFileBudget; lines: number }> = [];
  const warnings: Array<{ budget: CriticalFileBudget; lines: number }> = [];

  for (const budget of CRITICAL_FILE_BUDGETS) {
    const lines = countLines(budget.path);
    if (lines > budget.maxLines) {
      if (budget.severity === "error") violations.push({ budget, lines });
      else warnings.push({ budget, lines });
    }
  }

  console.log("Critical file size validation report");
  console.log("");
  for (const budget of CRITICAL_FILE_BUDGETS) {
    const lines = countLines(budget.path);
    const status = lines <= budget.maxLines ? "OK" : budget.severity === "error" ? "ERROR" : "WARN";
    console.log(`${status} ${budget.path} -> ${lines} lines (budget: ${budget.maxLines})`);
  }

  if (warnings.length > 0) {
    console.log("");
    console.log(`Warnings: ${warnings.length}`);
  }

  if (violations.length > 0) {
    console.log("");
    console.error(`Errors: ${violations.length}`);
    process.exit(1);
  }
}

main();
