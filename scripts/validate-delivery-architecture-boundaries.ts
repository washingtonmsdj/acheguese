import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");

const FORBIDDEN_CORE_DIRS = [
  path.join("src", "core", "order-delivery"),
  path.join("src", "core", "orders"),
  path.join("src", "core", "delivery"),
  path.join("src", "core", "logistics"),
];

const FORBIDDEN_IMPORT_PATTERNS = [
  "@/core/order-delivery",
  "@/core/orders",
  "@/core/delivery",
  "@/core/logistics",
];

const ALLOWED_VERTICAL_HOME = path.join("src", "modules", "mobility", "delivery");
const REQUIRED_DELIVERY_SUBDOMAINS = [
  path.join(ALLOWED_VERTICAL_HOME, "order"),
  path.join(ALLOWED_VERTICAL_HOME, "logistics"),
];
const DELIVERY_SERVICE_PATH = path.join(
  ALLOWED_VERTICAL_HOME,
  "services",
  "OrderDeliverySSOTService.ts",
);
const FORBIDDEN_DELIVERY_WRITE_REGEXES = [
  /\.from\((?:ORDER_TABLE|["']orders["'])\)\s*\.(?:insert|update|delete|upsert)\(/s,
  /\.from\((?:ORDER_ITEMS_TABLE|["']order_items["'])\)\s*\.(?:insert|update|delete|upsert)\(/s,
  /\.from\((?:ORDER_TIMELINE_TABLE|["']order_timeline_events["'])\)\s*\.(?:insert|update|delete|upsert)\(/s,
  /\.from\((?:DELIVERY_OCCURRENCES_TABLE|["']delivery_occurrences["'])\)\s*\.(?:insert|update|delete|upsert)\(/s,
];

function walkFiles(dir: string): string[] {
  const result: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkFiles(fullPath));
      continue;
    }
    result.push(fullPath);
  }

  return result;
}

function isCodeFile(filePath: string): boolean {
  return (
    filePath.endsWith(".ts") ||
    filePath.endsWith(".tsx") ||
    filePath.endsWith(".js") ||
    filePath.endsWith(".jsx")
  );
}

function main() {
  const violations: string[] = [];

  for (const relativeForbiddenDir of FORBIDDEN_CORE_DIRS) {
    const fullDir = path.join(ROOT, relativeForbiddenDir);
    if (fs.existsSync(fullDir)) {
      violations.push(
        `Diretório proibido em core detectado: ${relativeForbiddenDir}`,
      );
    }
  }

  const allFiles = walkFiles(SRC_DIR).filter(isCodeFile);
  for (const file of allFiles) {
    const content = fs.readFileSync(file, "utf-8");
    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      if (content.includes(pattern)) {
        const relativeFile = path.relative(ROOT, file);
        violations.push(
          `Import proibido "${pattern}" encontrado em ${relativeFile}`,
        );
      }
    }
  }

  if (!fs.existsSync(path.join(ROOT, ALLOWED_VERTICAL_HOME))) {
    violations.push(
      `Módulo vertical esperado não encontrado: ${ALLOWED_VERTICAL_HOME}`,
    );
  }

  for (const requiredSubdomain of REQUIRED_DELIVERY_SUBDOMAINS) {
    if (!fs.existsSync(path.join(ROOT, requiredSubdomain))) {
      violations.push(
        `Subdomínio obrigatório do módulo delivery ausente: ${requiredSubdomain}`,
      );
    }
  }

  if (fs.existsSync(path.join(ROOT, DELIVERY_SERVICE_PATH))) {
    const deliveryServiceContent = fs.readFileSync(
      path.join(ROOT, DELIVERY_SERVICE_PATH),
      "utf-8",
    );

    for (const regex of FORBIDDEN_DELIVERY_WRITE_REGEXES) {
      if (regex.test(deliveryServiceContent)) {
        violations.push(
          `Write direto em tabela operacional detectado em ${DELIVERY_SERVICE_PATH}. Use RPC transacional.`,
        );
        break;
      }
    }
  }

  if (violations.length > 0) {
    console.error("Violação de fronteira arquitetural detectada:\n");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Fronteiras arquiteturais de delivery estão válidas.");
}

main();
