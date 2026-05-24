import { supabase } from "@/integrations/supabase";
import type { AIProvider, IntentParserInput } from "../domain/types";

/**
 * Provider real isolado do frontend.
 *
 * A chave de IA nunca fica no bundle: a chamada passa por Edge Function.
 * A function `ai-intent-parse` valida autenticação, quota e payload no backend.
 */
export class OpenAIProvider implements AIProvider {
  async parseIntent(input: IntentParserInput): Promise<unknown> {
    const { data, error } = await supabase.functions.invoke("ai-intent-parse", {
      body: input,
    });

    if (error) throw error;
    return data;
  }
}
