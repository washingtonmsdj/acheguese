import { supabase } from "@/integrations/supabase";

export interface ApplicationLogRecord {
  level: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  context: Record<string, unknown>;
  url: string;
  user_agent: string;
  session_id: string;
}

export class ApplicationLogService {
  static async insert(records: ApplicationLogRecord[]): Promise<void> {
    if (records.length === 0) return;

    const { error } = await (supabase as any).from("application_logs").insert(records);
    if (error) throw error;
  }
}



