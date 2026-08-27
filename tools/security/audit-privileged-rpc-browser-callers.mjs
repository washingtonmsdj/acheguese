import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSupabaseCli } from "../supabase/supabase-cli-runner.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const SRC_ROOT = path.join(ROOT, "src");
const PRIVILEGED_RPC_SQL = [
  "select distinct p.proname",
  "from pg_proc p",
  "join pg_namespace n on n.oid = p.pronamespace",
  "where n.nspname = 'public'",
  "and has_function_privilege('service_role', p.oid, 'EXECUTE')",
  "and not has_function_privilege('authenticated', p.oid, 'EXECUTE')",
  "and not has_function_privilege('anon', p.oid, 'EXECUTE')",
  "order by p.proname;",
].join(" ");
const DIRECT_RPC_CALL_RE =
  /(?:\.rpc|callRPC)(?:<[\s\S]{0,500}?>)?\s*\(\s*["']([A-Za-z0-9_]+)["']/g;

function normalize(filePath) {
  return filePath.replaceAll("\\", "/");
}

function isBrowserSource(filePath) {
  const relative = normalize(path.relative(ROOT, filePath));
  return (
    /\.(ts|tsx)$/.test(relative) &&
    !relative.endsWith("/types.generated.ts") &&
    !relative.includes("/__tests__/") &&
    !/\.(spec|test)\.(ts|tsx)$/.test(relative)
  );
}

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && isBrowserSource(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function readRemotePrivilegedRpcNames() {
  const result = runSupabaseCli(
    ["db", "query", "--linked", "--agent=no", "-o", "json", PRIVILEGED_RPC_SQL],
    { cwd: ROOT },
  );

  if (result.error) {
    throw new Error(`Supabase CLI unavailable: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "Remote Supabase query failed");
  }

  const rows = JSON.parse(result.stdout);
  if (!Array.isArray(rows)) {
    throw new Error("Unexpected Supabase query response");
  }

  return new Set(
    rows.map((row) => row?.proname).filter((name) => typeof name === "string"),
  );
}

function collectDirectBrowserCalls(privilegedRpcNames) {
  const findings = [];

  for (const filePath of walk(SRC_ROOT)) {
    const content = readFileSync(filePath, "utf8");
    for (const match of content.matchAll(DIRECT_RPC_CALL_RE)) {
      const rpcName = match[1];
      if (!privilegedRpcNames.has(rpcName)) continue;

      const line = content.slice(0, match.index).split("\n").length;
      findings.push({
        file: normalize(path.relative(ROOT, filePath)),
        line,
        rpcName,
      });
    }
  }

  return findings;
}

function main() {
  const privilegedRpcNames = readRemotePrivilegedRpcNames();
  const findings = collectDirectBrowserCalls(privilegedRpcNames);

  if (findings.length > 0) {
    console.error("Direct browser calls to privileged RPCs detected:");
    for (const finding of findings) {
      console.error(`- ${finding.file}:${finding.line} -> ${finding.rpcName}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Privileged RPC browser caller audit passed: ${privilegedRpcNames.size} remote RPC name(s), zero direct browser calls.`,
  );
}

main();
