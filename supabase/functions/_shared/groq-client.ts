/**
 * AI Client - Lovable AI Gateway
 * 
 * Usa o Lovable AI Gateway (compatível com OpenAI API)
 * Modelo padrão: google/gemini-3-flash-preview
 */

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

const Ok = <T>(data: T): Result<T, never> => ({ success: true, data });
const Err = <E>(error: E): Result<never, E> => ({ success: false, error });

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GroqConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface GroqResponse {
  content: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4000;
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class GroqClient {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private timeout: number;

  constructor(config: GroqConfig) {
    if (!config.apiKey) {
      throw new Error("LOVABLE_API_KEY is required");
    }

    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.temperature = config.temperature ?? DEFAULT_TEMPERATURE;
    this.maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  }

  async chat(messages: ChatMessage[], options?: { responseFormat?: "text" | "json_object" }): Promise<Result<GroqResponse, Error>> {
    if (!Array.isArray(messages) || messages.length === 0) {
      return Err(new Error("Messages array is required and cannot be empty"));
    }

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.role || !msg.content) {
        return Err(new Error(`Message at index ${i} is missing role or content`));
      }
    }

    let lastError: Error = new Error("Unknown error");

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[AIClient] Attempt ${attempt}/${MAX_RETRIES}`, {
          model: this.model,
          messageCount: messages.length,
          responseFormat: options?.responseFormat,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const requestBody: Record<string, unknown> = {
            model: this.model,
            messages,
            temperature: this.temperature,
            max_tokens: this.maxTokens,
          };

          if (options?.responseFormat === "json_object") {
            requestBody.response_format = { type: "json_object" };
          }

          const response = await fetch(LOVABLE_AI_GATEWAY, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("[AIClient] API error:", {
              status: response.status,
              body: errorText,
            });

            if (response.status === 429) {
              lastError = new Error(`Rate limit exceeded (attempt ${attempt}/${MAX_RETRIES})`);
              if (attempt < MAX_RETRIES) {
                await this.sleep(RETRY_DELAY_MS * attempt);
                continue;
              }
            }

            if (response.status === 402) {
              return Err(new Error("Payment required - please add credits to your Lovable AI workspace"));
            }

            if (response.status >= 500) {
              lastError = new Error(`Server error: ${response.status} (attempt ${attempt}/${MAX_RETRIES})`);
              if (attempt < MAX_RETRIES) {
                await this.sleep(RETRY_DELAY_MS * attempt);
                continue;
              }
            }

            return Err(new Error(`AI Gateway error: ${response.status} - ${errorText}`));
          }

          const data = await response.json();

          if (!data.choices || data.choices.length === 0) {
            return Err(new Error("No choices returned from AI"));
          }

          const choice = data.choices[0];
          const content = choice.message?.content;

          if (!content) {
            return Err(new Error("No content in AI response"));
          }

          console.log("[AIClient] Success", {
            finishReason: choice.finish_reason,
            usage: data.usage,
          });

          return Ok({
            content,
            finishReason: choice.finish_reason,
            usage: data.usage,
          });
        } catch (error) {
          clearTimeout(timeoutId);
          if (error instanceof Error && error.name === "AbortError") {
            lastError = new Error(`Request timeout (attempt ${attempt}/${MAX_RETRIES})`);
            if (attempt < MAX_RETRIES) {
              await this.sleep(RETRY_DELAY_MS * attempt);
              continue;
            }
          }
          throw error;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[AIClient] Attempt ${attempt} failed:`, lastError);

        if (attempt < MAX_RETRIES) {
          await this.sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    return Err(lastError);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createGroqClient(config?: Partial<GroqConfig>): Result<GroqClient, Error> {
  const apiKey = config?.apiKey ?? Deno.env.get("LOVABLE_API_KEY");

  if (!apiKey) {
    return Err(new Error("LOVABLE_API_KEY environment variable is required"));
  }

  try {
    const client = new GroqClient({
      apiKey,
      model: config?.model,
      temperature: config?.temperature,
      maxTokens: config?.maxTokens,
      timeout: config?.timeout,
    });

    return Ok(client);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
