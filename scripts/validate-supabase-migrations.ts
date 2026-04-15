import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");
const FILENAME_PATTERN = /^(\d+)_(.+)\.sql$/;
const INVALID_DO_BLOCK_PATTERNS = [/^DO \$$/m, /^END \$;$/m];

interface MigrationFile {
  name: string;
  version: string;
  fullPath: string;
}

function readMigrationFiles(): MigrationFile[] {
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => {
      const match = entry.name.match(FILENAME_PATTERN);
      if (!match) {
        throw new Error(
          `Migration com nome invalido: ${entry.name}. Use <timestamp>_name.sql.`,
        );
      }

      return {
        name: entry.name,
        version: match[1],
        fullPath: path.join(MIGRATIONS_DIR, entry.name),
      };
    });
}

function main() {
  const violations: string[] = [];
  const files = readMigrationFiles();
  const seenVersions = new Map<string, string>();

  for (const file of files) {
    if (seenVersions.has(file.version)) {
      violations.push(
        `Versao duplicada ${file.version}: ${seenVersions.get(file.version)} e ${file.name}`,
      );
    } else {
      seenVersions.set(file.version, file.name);
    }

    const content = fs.readFileSync(file.fullPath, "utf8");
    if (content.length > 0 && content.charCodeAt(0) === 0xfeff) {
      violations.push(`Arquivo com BOM UTF-8 detectado: ${file.name}`);
    }

    for (const pattern of INVALID_DO_BLOCK_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(
          `Bloco DO com delimitador invalido detectado em ${file.name}. Use DO $$ ... END $$;`,
        );
        break;
      }
    }
  }

  if (violations.length > 0) {
    console.error("Falhas de hygiene em migrations Supabase:\n");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Migrations Supabase estao consistentes.");
}

main();
