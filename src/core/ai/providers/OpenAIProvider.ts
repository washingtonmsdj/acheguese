import { supabase } from "@/integrations/supabase";
import type { AIProvider, IntentParserInput } from "../domain/types";

/**
 * Provider real isolado do frontend.
 *
 * A chave de IA nunca fica no bundle: a chamada passa por Edge Function.
 * Esta Fase 1 usa MockAIProvider por padrão; este provider fica pronto para
 * quando a function `ai-intent-parse` existir.
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
