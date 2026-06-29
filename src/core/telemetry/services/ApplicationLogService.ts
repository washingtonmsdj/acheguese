import { supabase } from "@/integrations/supabase";

export interface ApplicationLogRecord {
  level: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  context: Record<string, unknown>;
  url: string;
  user_agent: string;
  session_id: string;
}

type QueryResult<T> = Promise<{ data: T; error: { code?: string; message?: string } | null }>;

interface QueryBuilder<TRow> {
  insert(values: unknown): QueryBuilder<TRow>;
  then<TResult1 = { data: TRow[]; error: { code?: string; message?: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: TRow[]; error: { code?: string; message?: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface TelemetryDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

const telemetryDb = supabase as unknown as TelemetryDbClient;

export class ApplicationLogService {
  static async insert(records: ApplicationLogRecord[]): Promise<void> {
    if (records.length === 0) {
      return;
    }

    const { error } = await telemetryDb
      .from<ApplicationLogRecord>("application_logs")
      .insert(records);

    if (error) {
      throw error;
    }
  }
}
