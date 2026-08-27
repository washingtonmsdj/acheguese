#!/usr/bin/env tsx

import { pathToFileURL } from "node:url";
import { SSotValidator } from "../tools/architecture/validate-ssot-compliance";

export { SSotValidator } from "../tools/architecture/validate-ssot-compliance";

// Compatibility bridge during G2 repository reorganization.
// Canonical owner: tools/architecture/validate-ssot-compliance.ts
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log("🔍 Iniciando validação SSOT...");
  const validator = new SSotValidator();
  validator.validateProject().catch(console.error);
}
