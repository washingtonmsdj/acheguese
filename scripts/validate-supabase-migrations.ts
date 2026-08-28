import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export * from "../tools/migrations/validate-supabase-migrations";

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  const executable = process.platform === "win32" ? "tsx.cmd" : "tsx";
  const result = spawnSync(
    executable,
    ["tools/migrations/validate-supabase-migrations.ts", ...process.argv.slice(2)],
    {
      cwd: process.cwd(),
      stdio: "inherit",
    },
  );

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}
