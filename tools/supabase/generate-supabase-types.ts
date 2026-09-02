import { writeFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { runSupabaseCli } from "./supabase-cli-runner.mjs";

loadEnv({ path: ".env" });

const OUTPUT_PATH = "src/integrations/supabase/types.generated.ts";
const projectId =
  process.env.VITE_SUPABASE_PROJECT_ID?.trim() ||
  process.env.SUPABASE_PROJECT_ID?.trim() ||
  process.env.PROJECT_REF?.trim();
const dbUrl = process.env.SUPABASE_DB_URL?.trim();

type GenerationMode = {
  label: string;
  args: string[];
};

const schemaArgs = ["--schema", "public"];
const modes: GenerationMode[] = [
  ...(dbUrl
    ? [{ label: "db-url", args: ["--db-url", dbUrl, ...schemaArgs] }]
    : []),
  { label: "linked", args: ["--linked", ...schemaArgs] },
  ...(projectId
    ? [
        {
          label: "project-id",
          args: ["--project-id", projectId, ...schemaArgs],
        },
      ]
    : []),
];

let lastError: unknown = null;

function redactSensitiveText(value: string): string {
  if (!dbUrl) return value;
  return value.split(dbUrl).join("[REDACTED_DB_URL]");
}

function generateTypes(mode: GenerationMode): string {
  const result = runSupabaseCli(["gen", "types", "typescript", ...mode.args]);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      redactSensitiveText(
        result.stderr?.trim() || "Supabase CLI type generation failed",
      ),
    );
  }
  return result.stdout;
}

for (const mode of modes) {
  try {
    const output = generateTypes(mode);
    if (!output.trim() || !output.includes("export type Database")) {
      throw new Error("Supabase CLI returned an invalid generated type artifact");
    }
    writeFileSync(OUTPUT_PATH, output, { encoding: "utf8" });
    console.log(
      `Types gerados com sucesso em ${OUTPUT_PATH} (mode: ${mode.label}).`,
    );
    process.exit(0);
  } catch (error) {
    lastError = error;
  }
}

const message =
  lastError instanceof Error
    ? redactSensitiveText(lastError.message)
    : "unknown supabase generation error";
console.error(`Erro ao gerar types do Supabase: ${message}`);
process.exit(1);
