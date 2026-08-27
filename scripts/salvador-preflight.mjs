#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { runSalvadorPreflightCli } from "../tools/supabase/salvador-preflight.mjs";

export * from "../tools/supabase/salvador-preflight.mjs";

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runSalvadorPreflightCli();
}
