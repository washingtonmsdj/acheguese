import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export * from "../tools/release/community-staging-load-test.mjs";

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const target = fileURLToPath(
    new URL("../tools/release/community-staging-load-test.mjs", import.meta.url),
  );
  const result = spawnSync(process.execPath, [target, ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
