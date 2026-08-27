import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { main } from "../tools/architecture/validate-ssot-hardcodes";

export * from "../tools/architecture/validate-ssot-hardcodes";

// Compatibility bridge during G2 repository reorganization.
// Canonical owner: tools/architecture/validate-ssot-hardcodes.ts
const isDirectExecution =
  Boolean(process.argv[1]) &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) main();
