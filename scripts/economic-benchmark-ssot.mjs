#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import dotenv from "dotenv";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const SQL_FILE = "docs/architecture/sql/economic-circulation-performance-check.sql";
const BENCH_DIR = ".tmp/bench";
const BEFORE_FILE = path.join(BENCH_DIR, "economic-circulation-before.txt");
const AFTER_FILE = path.join(BENCH_DIR, "economic-circulation-after.txt");
const SUMMARY_FILE = path.join(BENCH_DIR, "economic-circulation-summary.md");
const REPORT_DRAFT_FILE = path.join(BENCH_DIR, "economic-circulation-staging-report-draft.md");
const { Client } = pg;

function abs(p) {
  return path.resolve(ROOT, p);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runAllowFail(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
}

function ensureSql() {
  if (!fs.existsSync(SQL_FILE)) {
    fail(`SQL nao encontrado: ${abs(SQL_FILE)}`);
  }
}

function ensurePsqlAvailable() {
  const checker = spawnSync("psql", ["--version"], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  if (checker.status !== 0) {
    fail("psql nao encontrado no PATH.");
  }
}

function loadEnv() {
  const envFiles = [".env.local", ".env", ".env.production", ".env.remote", ".env.test"];
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file, override: false });
    }
  }
}

function readEnvVarFromFiles(keys, files) {
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const parsed = dotenv.parse(fs.readFileSync(file, "utf8"));
    for (const key of keys) {
      const value = parsed[key];
      if (value && String(value).trim()) {
        return String(value).trim();
      }
    }
  }
  return null;
}

function readAllEnvValuesFromFiles(keys, files) {
  const values = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const parsed = dotenv.parse(fs.readFileSync(file, "utf8"));
    for (const key of keys) {
      const value = parsed[key];
      if (value && String(value).trim()) {
        values.push(String(value).trim());
      }
    }
  }
  return Array.from(new Set(values));
}

function buildSupabaseApiCandidates(files) {
  const candidates = [];
  const seen = new Set();

  const addCandidate = (url, key, source) => {
    const cleanUrl = String(url || "").trim();
    const cleanKey = String(key || "").trim();
    if (!cleanUrl || !cleanKey) return;
    if (cleanUrl.includes("your-project")) return;
    const token = `${cleanUrl}::${cleanKey}`;
    if (seen.has(token)) return;
    seen.add(token);
    candidates.push({ url: cleanUrl, key: cleanKey, source });
  };

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const parsed = dotenv.parse(fs.readFileSync(file, "utf8"));
    const fileUrl = parsed.VITE_SUPABASE_URL;
    const fileKeys = [
      parsed.SUPABASE_SERVICE_ROLE_KEY,
      parsed.VITE_SUPABASE_PUBLISHABLE_KEY,
    ];
    for (const key of fileKeys) {
      addCandidate(fileUrl, key, file);
    }
  }

  const processUrl = process.env.VITE_SUPABASE_URL;
  const processKeys = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  ];
  for (const key of processKeys) {
    addCandidate(processUrl, key, "process.env");
  }

  return candidates;
}

function ensurePgEnv() {
  const required = ["PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD"];
  const missing = required.filter((key) => !process.env[key] || String(process.env[key]).trim() === "");
  if (missing.length > 0) {
    fail(`Variaveis de ambiente ausentes: ${missing.join(", ")}`);
  }
}

function buildPgConnectionCandidates() {
  const candidates = [];
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl && !databaseUrl.includes("your-project") && !databaseUrl.includes("[PASSWORD]")) {
    candidates.push({ label: "DATABASE_URL", connectionString: databaseUrl });
  }
  const supabaseDbUrl = process.env.SUPABASE_DB_URL?.trim();
  if (supabaseDbUrl && !supabaseDbUrl.includes("your-project") && !supabaseDbUrl.includes("[PASSWORD]")) {
    candidates.push({ label: "SUPABASE_DB_URL", connectionString: supabaseDbUrl });
  }
  const host = process.env.PGHOST?.trim();
  const port = process.env.PGPORT?.trim();
  const database = process.env.PGDATABASE?.trim();
  const user = process.env.PGUSER?.trim();
  const password = process.env.PGPASSWORD?.trim();
  if (host && port && database && user && password) {
    candidates.push({
      label: "PG*",
      connectionString: `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`,
    });
  }

  const viteSupabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
  const supabaseDbPassword = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (supabaseDbPassword) {
    try {
      const projectRefs = new Set();
      if (viteSupabaseUrl) {
        const url = new URL(viteSupabaseUrl);
        const ref = url.hostname.split(".")[0];
        if (ref) projectRefs.add(ref);
      }
      const envFiles = [".env.local", ".env", ".env.remote", ".env.production", ".env.test"];
      for (const envFile of envFiles) {
        if (!fs.existsSync(envFile)) continue;
        const content = fs.readFileSync(envFile, "utf8");
        const matches = content.matchAll(/VITE_SUPABASE_URL\s*=\s*["']?https:\/\/([a-z0-9-]+)\.supabase\.co["']?/gi);
        for (const match of matches) {
          if (match[1] && match[1] !== "your-project") projectRefs.add(match[1]);
        }
      }

      for (const projectRef of projectRefs) {
        const poolHosts = [
          process.env.SUPABASE_POOLER_HOST?.trim(),
          "aws-0-sa-east-1.pooler.supabase.com",
          "aws-0-us-east-1.pooler.supabase.com",
          "aws-0-us-west-1.pooler.supabase.com",
          "aws-0-eu-west-1.pooler.supabase.com",
        ].filter(Boolean);
        const poolPort = process.env.SUPABASE_POOLER_PORT?.trim() || "6543";
        const dbName = process.env.SUPABASE_DB_NAME?.trim() || "postgres";
        const defaultUser = `postgres.${projectRef}`;
        const userCandidates = [process.env.SUPABASE_DB_USER?.trim(), defaultUser, "postgres"].filter(Boolean);
        for (const poolHost of poolHosts) {
          for (const dbUser of userCandidates) {
            candidates.push({
              label: `SUPABASE_POOLER:${projectRef}:${poolHost}:${dbUser}`,
              connectionString: `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(supabaseDbPassword)}@${poolHost}:${poolPort}/${dbName}`,
            });
          }
        }
        for (const dbUser of userCandidates) {
          candidates.push({
            label: `SUPABASE_DIRECT_DB:${projectRef}:${dbUser}`,
            connectionString: `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(supabaseDbPassword)}@db.${projectRef}.supabase.co:5432/${dbName}`,
          });
        }
      }
    } catch {
      return candidates;
    }
  }
  return candidates;
}

function extractExplainStatements(sqlText) {
  const lines = sqlText.split(/\r?\n/);
  const statements = [];
  let current = [];
  let capturing = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!capturing && /^EXPLAIN\s*\(ANALYZE,\s*BUFFERS\)/i.test(trimmed)) {
      capturing = true;
      current = [line];
      if (trimmed.endsWith(";")) {
        statements.push(current.join("\n"));
        current = [];
        capturing = false;
      }
      continue;
    }
    if (capturing) {
      current.push(line);
      if (trimmed.endsWith(";")) {
        statements.push(current.join("\n"));
        current = [];
        capturing = false;
      }
    }
  }
  return statements;
}

async function runBenchmarkWithPg(outputPath) {
  loadEnv();
  const candidates = buildPgConnectionCandidates();
  if (candidates.length === 0) {
    fail("Conexao de banco nao configurada para benchmark (DATABASE_URL/SUPABASE_DB_URL/PG*).");
  }

  const sqlText = fs.readFileSync(SQL_FILE, "utf8");
  const explainStatements = extractExplainStatements(sqlText);
  if (explainStatements.length === 0) {
    fail(`Nenhum EXPLAIN encontrado em ${abs(SQL_FILE)}`);
  }

  let client = null;
  let connected = false;
  let lastError = null;

  for (const candidate of candidates) {
    const candidateClient = new Client({
      connectionString: candidate.connectionString,
      ssl: true,
      connectionTimeoutMillis: 12000,
    });
    try {
      await candidateClient.connect();
      client = candidateClient;
      connected = true;
      console.log(`Conectado via ${candidate.label}`);
      break;
    } catch (error) {
      lastError = error;
      await candidateClient.end().catch(() => {});
    }
  }

  if (!connected || !client) {
    throw new Error(`Nao foi possivel conectar em nenhuma rota de banco (${String(lastError)})`);
  }

  const output = [];
  output.push("-- Benchmark via node-postgres fallback (psql indisponivel)");
  output.push(`-- SQL source: ${SQL_FILE}`);
  output.push("");

  try {
    for (let i = 0; i < explainStatements.length; i += 1) {
      output.push(`EXPLAIN Query ${i + 1}`);
      const result = await client.query(explainStatements[i]);
      const rows = result.rows ?? [];
      for (const row of rows) {
        const planLine = row["QUERY PLAN"];
        if (typeof planLine === "string") {
          output.push(planLine);
        }
      }
      output.push("");
    }
  } finally {
    await client.end().catch(() => {});
  }

  fs.writeFileSync(outputPath, `${output.join("\n")}\n`, "utf8");
}

async function runBenchmarkWithSupabaseApi(outputPath) {
  loadEnv();
  const envPriority = [".env.local", ".env", ".env.remote", ".env.production", ".env.test"];
  const apiCandidates = buildSupabaseApiCandidates(envPriority);

  if (apiCandidates.length === 0) {
    fail("Fallback API indisponivel: VITE_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY nao configurados.");
  }

  let supabase = null;
  let chosenUrl = null;
  let chosenSource = null;
  let lastApiError = null;
  let chosenAvailability = null;
  let bestScore = -1;

  const probeAvailability = async (client) => {
    const [t1, t2, t3] = await Promise.all([
      client.from("public_work_opportunity_search").select("id").limit(1),
      client.from("work_opportunities").select("id").limit(1),
      client.from("vagas").select("id").limit(1),
    ]);
    return {
      workOpportunitiesView: !t1.error,
      workOpportunitiesTable: !t2.error,
      vagas: !t3.error,
    };
  };

  for (const apiCandidate of apiCandidates) {
    const candidate = createClient(apiCandidate.url, apiCandidate.key, { auth: { persistSession: false } });
    const availability = await probeAvailability(candidate);
    const score =
      (availability.workOpportunitiesView || availability.workOpportunitiesTable ? 2 : 0) +
      (availability.vagas ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      supabase = candidate;
      chosenUrl = apiCandidate.url;
      chosenSource = apiCandidate.source;
      chosenAvailability = availability;
    }
    if (score === 3) {
      break;
    }
    if (!availability.vagas && !availability.workOpportunitiesTable && !availability.workOpportunitiesView) {
      lastApiError = new Error("schema cache sem fontes economicas");
    }
  }

  if (!supabase || !chosenUrl) {
    throw new Error(`Nao foi possivel validar API Supabase para benchmark (${lastApiError?.message || "sem detalhes"})`);
  }

  const out = [];
  out.push("-- Benchmark via Supabase API fallback");
  out.push(`-- source_url=${chosenUrl}`);
  out.push(`-- source_env=${chosenSource}`);
  out.push(`-- source_coverage_score=${bestScore}`);
  out.push("");

  const availability = chosenAvailability ?? (await probeAvailability(supabase));

  const opportunitySource = availability.workOpportunitiesView
    ? "public_work_opportunity_search"
    : availability.workOpportunitiesTable
      ? "work_opportunities"
      : null;

  const run = async (label, fn) => {
    const t0 = performance.now();
    const { error } = await fn();
    const t1 = performance.now();
    if (error) {
      throw new Error(`${label}: ${error.message}`);
    }
    out.push(`EXPLAIN Query ${label}`);
    out.push(`Execution Time: ${(t1 - t0).toFixed(3)} ms`);
    out.push("");
  };

  if (opportunitySource) {
    await run("Q1_opportunity_timeline", async () =>
      supabase
        .from(opportunitySource)
        .select("id, headline, professional_category, territory_location_id, urgency, published_at, created_at")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(40),
    );

    await run("Q2_opportunity_search", async () =>
      supabase
        .from(opportunitySource)
        .select("id, headline, description, professional_category")
        .or("headline.ilike.%pizzaiolo%,description.ilike.%pizzaiolo%,professional_category.ilike.%pizzaiolo%")
        .order("created_at", { ascending: false })
        .limit(20),
    );
  } else {
    out.push("EXPLAIN Query Q1_opportunity_timeline");
    out.push("SKIPPED: opportunity source unavailable in current schema cache");
    out.push("");
    out.push("EXPLAIN Query Q2_opportunity_search");
    out.push("SKIPPED: opportunity source unavailable in current schema cache");
    out.push("");
  }

  if (availability.vagas) {
    await run("Q3_vagas_search", async () =>
      supabase
        .from("vagas")
        .select("id, titulo, categoria, bairro_nome, published_at, created_at")
        .or("titulo.ilike.%pizzaiolo%,descricao.ilike.%pizzaiolo%,categoria.ilike.%pizzaiolo%,bairro_nome.ilike.%pituba%")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(20),
    );
  } else {
    out.push("EXPLAIN Query Q3_vagas_search");
    out.push("SKIPPED: vagas unavailable in current schema cache");
    out.push("");
  }

  fs.writeFileSync(outputPath, `${out.join("\n")}\n`, "utf8");
}

function ensureBenchDir() {
  fs.mkdirSync(BENCH_DIR, { recursive: true });
}

async function runBenchmarkPhase(phase) {
  ensureSql();
  loadEnv();
  ensureBenchDir();

  const output = phase === "before" ? BEFORE_FILE : AFTER_FILE;
  console.log(`Executando benchmark phase=${phase}`);
  const hasPsql =
    spawnSync("psql", ["--version"], {
      stdio: "ignore",
      shell: process.platform === "win32",
    }).status === 0;

  if (hasPsql) {
    ensurePgEnv();
    const psql = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-f", SQL_FILE], {
      encoding: "utf8",
      shell: process.platform === "win32",
    });
    if (psql.status !== 0) {
      process.stderr.write(psql.stderr ?? "");
      process.exit(psql.status ?? 1);
    }
    fs.writeFileSync(output, psql.stdout ?? "", "utf8");
  } else {
    console.log("psql indisponivel; priorizando fallback SSOT via Supabase API.");
    try {
      await runBenchmarkWithSupabaseApi(output);
    } catch (apiError) {
      console.log("Fallback API falhou. Tentando node-postgres...");
      try {
        await runBenchmarkWithPg(output);
      } catch (pgError) {
        console.log("Rodando diagnostico de conectividade para evidenciar causa...");
        runAllowFail("node", ["scripts/diagnose-economic-db-connectivity.mjs"]);
        fail(
          `Falha no fallback API: ${apiError instanceof Error ? apiError.message : String(apiError)} | ` +
            `Falha no fallback node-postgres: ${pgError instanceof Error ? pgError.message : String(pgError)}`,
        );
      }
    }
  }

  console.log(`Resultado salvo em: ${abs(output)}`);
}

function compare() {
  run("node", ["scripts/compare-economic-benchmark.mjs", BEFORE_FILE, AFTER_FILE, SUMMARY_FILE]);
}

function report() {
  run("node", ["scripts/generate-economic-staging-report.mjs", SUMMARY_FILE, REPORT_DRAFT_FILE]);
}

function finalize() {
  run("node", ["scripts/finalize-economic-benchmark.mjs"]);
}

function usage() {
  console.log("Uso:");
  console.log("  node scripts/economic-benchmark-ssot.mjs before");
  console.log("  node scripts/economic-benchmark-ssot.mjs after");
  console.log("  node scripts/economic-benchmark-ssot.mjs compare");
  console.log("  node scripts/economic-benchmark-ssot.mjs report");
  console.log("  node scripts/economic-benchmark-ssot.mjs finalize");
}

const command = process.argv[2];

async function main() {
  switch (command) {
    case "before":
      await runBenchmarkPhase("before");
      break;
    case "after":
      await runBenchmarkPhase("after");
      if (fs.existsSync(BEFORE_FILE) && fs.existsSync(AFTER_FILE)) {
        compare();
      } else {
        console.log("Comparacao ignorada: arquivo before nao encontrado.");
      }
      break;
    case "compare":
      compare();
      break;
    case "report":
      report();
      break;
    case "finalize":
      finalize();
      break;
    default:
      usage();
      process.exit(command ? 1 : 0);
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
