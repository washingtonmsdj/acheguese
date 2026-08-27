import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const SUPABASE_CLI_ENTRYPOINT =
  require.resolve("supabase/dist/supabase.js");

export function createSupabaseCliInvocation(
  args,
  { cwd = process.cwd() } = {},
) {
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) {
    throw new TypeError("Supabase CLI args must be an array of strings.");
  }

  return {
    args: [SUPABASE_CLI_ENTRYPOINT, ...args],
    executable: process.execPath,
    options: {
      cwd,
      encoding: "utf8",
      shell: false,
    },
  };
}

export function runSupabaseCli(args, options = {}) {
  const { spawn = spawnSync, ...invocationOptions } = options;
  const invocation = createSupabaseCliInvocation(args, invocationOptions);

  return spawn(invocation.executable, invocation.args, invocation.options);
}
