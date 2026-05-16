import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });

const OUTPUT_PATH = "src/integrations/supabase/types.generated.ts";
const projectId = process.env.VITE_SUPABASE_PROJECT_ID?.trim();
type GenerationMode = {
  label: string;
  commandSuffix: string;
};

const modes: GenerationMode[] = [
  { label: "linked", commandSuffix: "--linked" },
  ...(projectId ? [{ label: "project-id", commandSuffix: `--project-id ${projectId}` }] : []),
];

let lastError: unknown = null;

function tryGenerateWith(commandPrefix: "supabase" | "npx supabase", mode: GenerationMode): string {
  return execSync(`${commandPrefix} gen types typescript ${mode.commandSuffix}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

for (const mode of modes) {
  try {
    let output: string;
    try {
      output = tryGenerateWith("supabase", mode);
    } catch {
      output = tryGenerateWith("npx supabase", mode);
    }

    writeFileSync(OUTPUT_PATH, output, { encoding: "utf8" });
    console.log(`Types gerados com sucesso em ${OUTPUT_PATH} (mode: ${mode.label}).`);
    process.exit(0);
  } catch (error) {
    lastError = error;
  }
}

const message =
  lastError instanceof Error ? lastError.message : "unknown supabase generation error";
console.error(`Erro ao gerar types do Supabase: ${message}`);
process.exit(1);
