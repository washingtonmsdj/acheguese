import { writeFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { runSupabaseCli } from "./supabase-cli-runner.mjs";

loadEnv({ path: ".env" });

const OUTPUT_PATH = "src/integrations/supabase/types.generated.ts";
const projectId = process.env.VITE_SUPABASE_PROJECT_ID?.trim();
type GenerationMode = {
  label: string;
  args: string[];
};

const modes: GenerationMode[] = [
  { label: "linked", args: ["--linked"] },
  ...(projectId
    ? [{ label: "project-id", args: ["--project-id", projectId] }]
    : []),
];

let lastError: unknown = null;

function generateTypes(mode: GenerationMode): string {
  const result = runSupabaseCli(["gen", "types", "typescript", ...mode.args]);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() || "Supabase CLI type generation failed",
    );
  }
  return result.stdout;
}

for (const mode of modes) {
  try {
    const output = generateTypes(mode);
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
    ? lastError.message
    : "unknown supabase generation error";
console.error(`Erro ao gerar types do Supabase: ${message}`);
process.exit(1);
