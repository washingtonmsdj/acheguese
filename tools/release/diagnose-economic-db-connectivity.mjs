#!/usr/bin/env node
import fs from "node:fs";
import dns from "node:dns/promises";
import { Client } from "pg";
import dotenv from "dotenv";
import path from "node:path";

function loadEnv() {
  const files = [".env.local", ".env", ".env.production", ".env.remote", ".env.test"];
  for (const f of files) {
    if (fs.existsSync(f)) dotenv.config({ path: f, override: false });
  }
}

function candidateRefs() {
  const refs = new Set();
  const fromVar = process.env.VITE_SUPABASE_URL?.trim();
  if (fromVar) {
    try {
      const ref = new URL(fromVar).hostname.split(".")[0];
      if (ref && ref !== "your-project") refs.add(ref);
    } catch {}
  }
  for (const f of [".env.local", ".env", ".env.remote", ".env.production", ".env.test"]) {
    if (!fs.existsSync(f)) continue;
    const txt = fs.readFileSync(f, "utf8");
    const matches = txt.matchAll(/VITE_SUPABASE_URL\s*=\s*["']?https:\/\/([a-z0-9-]+)\.supabase\.co["']?/gi);
    for (const m of matches) {
      if (m[1] && m[1] !== "your-project") refs.add(m[1]);
    }
  }
  return [...refs];
}

function buildCandidates() {
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const db = process.env.SUPABASE_DB_NAME?.trim() || "postgres";
  const portPool = process.env.SUPABASE_POOLER_PORT?.trim() || "6543";
  const hosts = [
    process.env.SUPABASE_POOLER_HOST?.trim(),
    "aws-0-sa-east-1.pooler.supabase.com",
    "aws-0-us-east-1.pooler.supabase.com",
    "aws-0-us-west-1.pooler.supabase.com",
    "aws-0-eu-west-1.pooler.supabase.com",
  ].filter(Boolean);
  const refs = candidateRefs();
  const out = [];
  if (!password || refs.length === 0) return out;
  for (const ref of refs) {
    const users = [process.env.SUPABASE_DB_USER?.trim(), `postgres.${ref}`, "postgres"].filter(Boolean);
    for (const u of users) {
      for (const h of hosts) {
        out.push({
          label: `pooler:${ref}:${h}:${u}`,
          host: h,
          port: Number(portPool),
          database: db,
          user: u,
          password,
          ssl: true,
        });
      }
      out.push({
        label: `direct:${ref}:db.${ref}.supabase.co:${u}`,
        host: `db.${ref}.supabase.co`,
        port: 5432,
        database: db,
        user: u,
        password,
        ssl: true,
      });
    }
  }
  return out;
}

async function testDns(host) {
  try {
    await dns.lookup(host);
    return { ok: true };
  } catch (e) {
    return { ok: false, err: e?.code || String(e) };
  }
}

async function testPg(cfg) {
  const client = new Client({ ...cfg, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    await client.query("select 1");
    await client.end();
    return { ok: true };
  } catch (e) {
    await client.end().catch(() => {});
    return { ok: false, err: e?.code || e?.message || String(e) };
  }
}

async function main() {
  loadEnv();
  const candidates = buildCandidates();
  if (candidates.length === 0) {
    console.log("Sem candidatos de conexao. Verifique VITE_SUPABASE_URL e SUPABASE_DB_PASSWORD.");
    process.exit(1);
  }

  const lines = [];
  lines.push("=== DB Connectivity Diagnose (Economic Benchmark SSOT) ===");
  const startedAt = new Date().toISOString();
  lines.push(`started_at=${startedAt}`);
  console.log(lines[0]);
  console.log(lines[1]);
  for (const c of candidates) {
    const dnsResult = await testDns(c.host);
    if (!dnsResult.ok) {
      const row = `DNS_FAIL  ${c.label} -> ${dnsResult.err}`;
      console.log(row);
      lines.push(row);
      continue;
    }
    const pg = await testPg(c);
    if (pg.ok) {
      const row = `PG_OK     ${c.label}`;
      console.log(row);
      lines.push(row);
      const outFile = ".tmp/bench/economic-circulation-db-diagnose.log";
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, `${lines.join("\n")}\n`, "utf8");
      console.log(`diagnose_log=${path.resolve(outFile)}`);
      process.exit(0);
    }
    const row = `PG_FAIL   ${c.label} -> ${pg.err}`;
    console.log(row);
    lines.push(row);
  }

  const outFile = ".tmp/bench/economic-circulation-db-diagnose.log";
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${lines.join("\n")}\n`, "utf8");
  console.log(`diagnose_log=${path.resolve(outFile)}`);
  process.exit(2);
}

main();
