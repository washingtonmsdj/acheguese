#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseMsBlocks(content) {
  const lines = content.split(/\r?\n/);
  const out = [];
  let currentQuery = 0;

  for (const line of lines) {
    if (/^EXPLAIN/i.test(line.trim())) {
      currentQuery += 1;
      continue;
    }

    const m = line.match(/Execution Time:\s*([\d.]+)\s*ms/i);
    if (m) {
      out.push({
        query: currentQuery || out.length + 1,
        executionMs: Number.parseFloat(m[1]),
      });
    }
  }

  return out;
}

function summary(name, rows) {
  const values = rows.map((r) => r.executionMs).filter((n) => Number.isFinite(n));
  if (values.length === 0) return { name, count: 0, total: 0, avg: 0, max: 0 };
  const total = values.reduce((a, b) => a + b, 0);
  const avg = total / values.length;
  const max = Math.max(...values);
  return { name, count: values.length, total, avg, max };
}

function pct(before, after) {
  if (!Number.isFinite(before) || before === 0) return null;
  return ((after - before) / before) * 100;
}

function fmt(num, digits = 2) {
  return Number.isFinite(num) ? num.toFixed(digits) : "-";
}

function main() {
  const beforePath = process.argv[2] || ".tmp/bench/economic-circulation-before.txt";
  const afterPath = process.argv[3] || ".tmp/bench/economic-circulation-after.txt";
  const reportPath = process.argv[4] || ".tmp/bench/economic-circulation-summary.md";

  if (!fs.existsSync(beforePath)) {
    console.error(`Arquivo before nao encontrado: ${beforePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(afterPath)) {
    console.error(`Arquivo after nao encontrado: ${afterPath}`);
    process.exit(1);
  }

  const beforeContent = fs.readFileSync(beforePath, "utf8");
  const afterContent = fs.readFileSync(afterPath, "utf8");
  const beforeRows = parseMsBlocks(beforeContent);
  const afterRows = parseMsBlocks(afterContent);

  const maxLen = Math.max(beforeRows.length, afterRows.length);
  console.log("=== Economic Circulation Benchmark Diff ===");
  console.log(`before: ${path.resolve(beforePath)}`);
  console.log(`after : ${path.resolve(afterPath)}`);
  console.log("");
  console.log("Por query:");
  for (let i = 0; i < maxLen; i += 1) {
    const b = beforeRows[i]?.executionMs;
    const a = afterRows[i]?.executionMs;
    const d = Number.isFinite(a) && Number.isFinite(b) ? a - b : NaN;
    const p = Number.isFinite(a) && Number.isFinite(b) ? pct(b, a) : null;
    console.log(
      `Q${i + 1}: before=${fmt(b)}ms | after=${fmt(a)}ms | delta=${fmt(d)}ms | delta%=${
        p === null ? "-" : `${fmt(p)}%`
      }`,
    );
  }

  const sb = summary("before", beforeRows);
  const sa = summary("after", afterRows);
  const deltaTotal = sa.total - sb.total;
  const deltaAvg = sa.avg - sb.avg;
  const deltaMax = sa.max - sb.max;

  console.log("");
  console.log("Resumo:");
  console.log(
    `count=${sb.count}/${sa.count} | total=${fmt(sb.total)}ms -> ${fmt(sa.total)}ms | delta=${fmt(deltaTotal)}ms (${fmt(
      pct(sb.total, sa.total) ?? NaN,
    )}%)`,
  );
  console.log(
    `avg=${fmt(sb.avg)}ms -> ${fmt(sa.avg)}ms | delta=${fmt(deltaAvg)}ms (${fmt(pct(sb.avg, sa.avg) ?? NaN)}%)`,
  );
  console.log(
    `max=${fmt(sb.max)}ms -> ${fmt(sa.max)}ms | delta=${fmt(deltaMax)}ms (${fmt(pct(sb.max, sa.max) ?? NaN)}%)`,
  );

  const lines = [];
  lines.push("# Economic Circulation Benchmark Summary");
  lines.push("");
  lines.push(`- before: \`${path.resolve(beforePath)}\``);
  lines.push(`- after: \`${path.resolve(afterPath)}\``);
  lines.push("");
  lines.push("## Per Query");
  lines.push("");
  lines.push("| Query | Before (ms) | After (ms) | Delta (ms) | Delta (%) |");
  lines.push("|---|---:|---:|---:|---:|");
  for (let i = 0; i < maxLen; i += 1) {
    const b = beforeRows[i]?.executionMs;
    const a = afterRows[i]?.executionMs;
    const d = Number.isFinite(a) && Number.isFinite(b) ? a - b : NaN;
    const p = Number.isFinite(a) && Number.isFinite(b) ? pct(b, a) : null;
    lines.push(
      `| Q${i + 1} | ${fmt(b)} | ${fmt(a)} | ${fmt(d)} | ${p === null ? "-" : fmt(p)}% |`,
    );
  }
  lines.push("");
  lines.push("## Aggregate");
  lines.push("");
  lines.push("| Metric | Before | After | Delta | Delta (%) |");
  lines.push("|---|---:|---:|---:|---:|");
  lines.push(
    `| Total execution (ms) | ${fmt(sb.total)} | ${fmt(sa.total)} | ${fmt(deltaTotal)} | ${fmt(
      pct(sb.total, sa.total) ?? NaN,
    )}% |`,
  );
  lines.push(
    `| Average execution (ms) | ${fmt(sb.avg)} | ${fmt(sa.avg)} | ${fmt(deltaAvg)} | ${fmt(
      pct(sb.avg, sa.avg) ?? NaN,
    )}% |`,
  );
  lines.push(
    `| Max execution (ms) | ${fmt(sb.max)} | ${fmt(sa.max)} | ${fmt(deltaMax)} | ${fmt(
      pct(sb.max, sa.max) ?? NaN,
    )}% |`,
  );
  lines.push("");
  lines.push("## Decision Hint");
  lines.push("");
  if (Number.isFinite(pct(sb.total, sa.total)) && pct(sb.total, sa.total) < 0) {
    lines.push("- Result: improved total execution time.");
  } else if (Number.isFinite(pct(sb.total, sa.total)) && pct(sb.total, sa.total) > 0) {
    lines.push("- Result: regression in total execution time.");
  } else {
    lines.push("- Result: insufficient data.");
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
  console.log("");
  console.log(`Markdown summary written to: ${path.resolve(reportPath)}`);
}

main();
