#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export * from "../tools/supabase/community-interest-preflight.mjs";

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const target = fileURLToPath(
    new URL("../tools/supabase/community-interest-preflight.mjs", import.meta.url),
  );
  const result = spawnSync(process.execPath, [target, ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
