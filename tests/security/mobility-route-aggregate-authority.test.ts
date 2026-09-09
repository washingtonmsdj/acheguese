import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(root, relativePath), "utf8");
}

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      collectSourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("Mobility route aggregate authority", () => {
  const migration = readProjectFile(
    "supabase/migrations/20260909205121_fail_close_dormant_route_writes_g29.sql",
  );

  it("preserves the route aggregate while fail-closing direct browser writes", () => {
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE\n  ON TABLE public.driver_routes",
    );
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE\n  ON TABLE public.route_reservations",
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Drivers manage own routes"',
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Passengers manage own reservations"',
    );
    expect(migration).toContain(
      'CREATE POLICY "Drivers view own routes"',
    );
    expect(migration).not.toContain("DROP TABLE");
  });

  it("does not reintroduce direct route/reservation DML in browser source", () => {
    const source = collectSourceFiles(path.resolve(root, "src"))
      .map((file) => fs.readFileSync(file, "utf8"))
      .join("\n");

    for (const table of ["driver_routes", "route_reservations"]) {
      const directMutation = new RegExp(
        String.raw`\.from\(["']${table}["']\)[\s\S]{0,260}\.(insert|update|delete)\(`,
        "m",
      );
      expect(source).not.toMatch(directMutation);
    }
  });

  it("keeps read-side schema and LGPD export ownership intact", () => {
    const exportFn = readProjectFile(
      "supabase/functions/user-export-data/index.ts",
    );
    expect(exportFn).toContain('"driver_routes"');
    expect(exportFn).toContain('"route_reservations"');
  });
});
