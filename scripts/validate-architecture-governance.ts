#!/usr/bin/env tsx

import path from "node:path";
import { fileURLToPath } from "node:url";
import { main } from "../tools/architecture/validate-architecture-governance";

export * from "../tools/architecture/validate-architecture-governance";

// Compatibility bridge during G2 repository reorganization.
// Canonical owner: tools/architecture/validate-architecture-governance.ts
const currentModulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentModulePath) {
  main();
}
