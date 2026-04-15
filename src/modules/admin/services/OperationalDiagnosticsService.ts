// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export type TableHealthState = "ok" | "missing" | "error" | "not_provisioned";

export interface OperationalTable {
  table: string;
  label: string;
  required: boolean;
}

export interface OperationalTableResult extends OperationalTable {
  state: TableHealthState;
  detail: string | null;
}

const TABLE_NOT_FOUND_CODES = new Set(["42P01", "PGRST116", "PGRST205"]);

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string; details?: string };
  if (candidate.code && TABLE_NOT_FOUND_CODES.has(candidate.code)) {
    return true;
  }

  const haystack = `${candidate.message ?? ""} ${candidate.details ?? ""}`.toLowerCase();
  return (
    haystack.includes("does not exist") ||
    haystack.includes("relation") ||
    haystack.includes("could not find table") ||
    haystack.includes("not found")
  );
}

class OperationalDiagnosticsService {
  async checkTables(definitions: OperationalTable[]): Promise<OperationalTableResult[]> {
    const checks = await Promise.all(
      definitions.map(async (definition): Promise<OperationalTableResult> => {
        const { error, count } = await (supabase as any)
          .from(definition.table)
          .select("*", { head: true, count: "exact" });

        if (!error) {
          return {
            ...definition,
            state: "ok",
            detail: `${count ?? 0} registros`,
          };
        }

        if (isMissingTable(error)) {
          return {
            ...definition,
            state: "missing",
            detail: "Tabela ausente no schema atual",
          };
        }

        return {
          ...definition,
          state: "error",
          detail: error.message ?? "Erro ao consultar tabela",
        };
      }),
    );

    return checks;
  }
}

export const operationalDiagnosticsService = new OperationalDiagnosticsService();
