/**
 * Groq API Client
 * 
 * Cliente para chamadas à API Groq com retry automático.
 * Extraído de game-ai-chat-stream/index.ts para ser reutilizável e testável.
 */

import { createGroqClient, type ChatMessage as GroqChatMessage } from "./groq-client.ts";
import { GROQ_CONFIG } from "./constants.ts";
import { createLogger } from "./logger.ts";

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Chama Groq API com retry automático
 * 
 * @param messages - Mensagens do chat
 * @param systemPromptText - System prompt
 * @param logger - Logger instance
 * @param sessionId - Session ID para logging
 * @returns Resposta da IA
 * @throws Error se a chamada falhar
 */
export async function callGroqWithRetry(
  messages: GroqChatMessage[],
  systemPromptText: string,
  logger: ReturnType<typeof createLogger>,
  sessionId?: string
): Promise<string> {
  const clientResult = createGroqClient();
  
  if (!clientResult.success) {
    logger.error("Failed to create Groq client", clientResult.error, sessionId);
    throw new Error(`Groq client creation failed: ${clientResult.error.message}`);
  }
  
  const client = clientResult.data;

  // Injetar system prompt UMA ÚNICA VEZ (não duplicar se já existir)
  const hasSystemMessage = messages.some((m) => m.role === "system");
  const aiMessages: GroqChatMessage[] = hasSystemMessage
    ? messages
    : [{ role: "system", content: systemPromptText }, ...messages];

  logger.info("Calling Groq API", {
    model: GROQ_CONFIG.DEFAULT_MODEL,
    messageCount: aiMessages.length,
    hasSystemMessage
  }, sessionId);

  // Chamar Groq com retry automático
  const result = await client.chat(aiMessages);
  
  if (!result.success) {
    const error = result.error;
    logger.error("Groq API error", error, sessionId);
    
    // Mapear erros para status codes apropriados
    const errorMessage = error.message;
    if (errorMessage.includes("Rate limit")) {
      throw new Error("Groq rate limit exceeded (429)");
    }
    if (errorMessage.includes("timeout")) {
      throw new Error("Groq request timeout");
    }
    if (errorMessage.includes("API key")) {
      throw new Error("Groq API key invalid (401)");
    }
    
    throw error;
  }

  const content = result.data.content;

  if (!content) {
    logger.error("Empty content from Groq", null, sessionId);
    throw new Error("Empty content from Groq");
  }

  logger.info("Groq response received", {
    hasContent: !!content,
    contentLength: content.length,
    usage: result.data.usage,
  }, sessionId);

  return content;
}
