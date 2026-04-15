// AI Provider Abstraction - Lovable AI Gateway
// Usa o gateway da Lovable para acesso a modelos de IA

export type AIProvider = "lovable";

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: AIProvider;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Detecta provider - sempre Lovable AI Gateway
 */
export function detectAIProvider(): AIProviderConfig {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!lovableKey) {
    throw new Error(
      "LOVABLE_API_KEY não configurada. Habilite o Lovable Cloud."
    );
  }

  return {
    provider: "lovable",
    apiKey: lovableKey,
    baseUrl: "https://ai.gateway.lovable.dev/v1",
    model: "google/gemini-3-flash-preview",
  };
}

/**
 * Chama o Lovable AI Gateway
 */
export async function callAI(
  messages: AIMessage[],
  config?: AIProviderConfig,
  temperature: number = 0.7,
  maxTokens: number = 4096
): Promise<AIResponse> {
  const providerConfig = config || detectAIProvider();

  const safeMessages: AIMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${providerConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: providerConfig.model,
      messages: safeMessages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Tente novamente em alguns segundos.");
    }
    if (response.status === 402) {
      throw new Error("Créditos insuficientes. Adicione créditos ao seu workspace Lovable.");
    }
    
    throw new Error(
      `AI Gateway error: ${response.status} - ${error}`
    );
  }

  const data = await response.json();

  return {
    content: data.choices[0].message.content,
    model: data.model,
    provider: providerConfig.provider,
    usage: data.usage,
  };
}

/**
 * Chama o provider com streaming
 */
export async function callAIStream(
  messages: AIMessage[],
  config?: AIProviderConfig,
  temperature: number = 0.7,
  maxTokens: number = 4096
): Promise<ReadableStream<string>> {
  const providerConfig = config || detectAIProvider();

  const safeMessages: AIMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${providerConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: providerConfig.model,
      messages: safeMessages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `AI Gateway error: ${response.status} - ${error}`
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line || line.startsWith(":")) continue;
            if (!line.startsWith("data: ")) continue;

            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(content);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * Retorna informações sobre o provider configurado
 */
export function getProviderInfo(config?: AIProviderConfig): string {
  const providerConfig = config || detectAIProvider();
  return `Provider: Lovable AI | Model: ${providerConfig.model}`;
}
