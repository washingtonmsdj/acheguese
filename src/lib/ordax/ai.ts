import { ordaxSpecSchema } from "@/lib/ordax/schema";
import type { OrdaxSpec, ChatMsg } from "@/lib/ordax/types";
import { normalizeOrdaxSpec } from "@/lib/ordax/normalize";
import { legacyGenerateSpec } from "@/lib/services/gameAiChatService";

// ✅ SSOT: ChatMsg re-exportado de types.ts

// 🔒 CORREÇÃO FINAL #3.2: LEGACY CLIENT - ISOLADO DO PIPELINE ORDAX
// ⚠️ DEPRECATED: Este cliente usa protocolo antigo e NÃO segue o pipeline FSM
// ⚠️ Para novo desenvolvimento, use StudioChatPanel.tsx que segue o protocolo completo
// ⚠️ Este arquivo existe apenas para compatibilidade com código legado
const legacyUserId = `user_${Math.random().toString(16).slice(2)}`;

/**
 * @deprecated Use StudioChatPanel.tsx para novo desenvolvimento
 * Este cliente legacy não segue o pipeline FSM completo
 */
export async function generateOrdaxSpec(
  messages: ChatMsg[],
  currentSpec?: OrdaxSpec,
): Promise<{ spec?: OrdaxSpec; raw?: string; error?: string }> {
  console.warn("⚠️ LEGACY CLIENT: generateOrdaxSpec() is deprecated. Use StudioChatPanel.tsx");
  
  const { data, error } = await legacyGenerateSpec(
    messages,
    currentSpec,
    legacyUserId
  );

  if (error) return { error: error.message };
  
  const raw = (data as Record<string, unknown>)?.raw as string | undefined;
  if (!raw) return { error: "Resposta vazia da IA." };

  try {
    const json = JSON.parse(raw);
    const parsed = ordaxSpecSchema.safeParse(json);
    if (!parsed.success) {
      return { raw, error: "A IA retornou JSON inválido para o schema do Ordax." };
    }
    return { spec: normalizeOrdaxSpec(parsed.data), raw };
  } catch {
    return { raw, error: "A IA não retornou JSON parseável." };
  }
}
