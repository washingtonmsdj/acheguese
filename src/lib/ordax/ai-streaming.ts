// AI Streaming Client
import { supabase } from "@/integrations/supabase/client";
import type { CompilerPhase, OrdaxSpec, ChatMsg } from "@/lib/ordax/types";
import type { CodeSemanticPatch } from "@/lib/ordax/code-mutator";
import {
  SUPABASE_FUNCTIONS,
  API_PATHS,
  HTTP_HEADERS,
  ERROR_MESSAGES,
  STREAMING,
  ERROR_DETAILS,
  ENV_VARS,
  RETRY,
  TIMEOUT,
  RECONNECT,
  QUEUE,
  METRICS,
} from "./ai-streaming-constants";
import {
  validateMessages,
  validateEnvVars,
  isValidString,
  isValidUrl,
  isValidJsonString,
  safeJsonParse,
  isValidStreamValue,
} from "./ai-streaming-validators";
import {
  sleep,
  retryWithBackoff,
  withTimeout,
  isRetryableError,
  isRetryableStatus,
  MetricsTracker,
  RequestQueue,
  ProgressTracker,
} from "./ai-streaming-utils";

// ✅ SSOT: ChatMsg re-exportado de types.ts
export type { ChatMsg } from "@/lib/ordax/types";

export type StreamCallback = (chunk: string) => void;

export type GeneratedFile = {
  path: string;
  content: string;
};

export type GenerationResult = {
  files: GeneratedFile[];
  spec?: OrdaxSpec;
  patch?: CodeSemanticPatch;
  fullResponse: string;
  planWarnings?: string[];
  assistantSummary?: string;
  appliedEdits?: string[];
  semanticPatch?: Record<string, unknown>;
  report?: Record<string, unknown>;
  engineGapReport?: Record<string, unknown>;
  error?: string;
};

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: string[];
}

export function validateGenerationResult(data: unknown): ValidationResult<GenerationResult> {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data must be an object'] };
  }

  const obj = data as Record<string, unknown>;
  const errors: string[] = [];

  // Validar files
  if (!Array.isArray(obj.files)) {
    errors.push('files must be an array');
  } else {
    for (const file of obj.files) {
      if (typeof file !== 'object' || !file) {
        errors.push('file must be an object');
        break;
      }
      const fileObj = file as Record<string, unknown>;
      if (typeof fileObj.path !== 'string') {
        errors.push('file.path must be a string');
      }
      if (typeof fileObj.content !== 'string') {
        errors.push('file.content must be a string');
      }
    }
  }

  // Validar fullResponse
  if (typeof obj.fullResponse !== 'string') {
    errors.push('fullResponse must be a string');
  }

  // Validar spec se existir
  if (obj.spec !== undefined && (typeof obj.spec !== 'object' || Array.isArray(obj.spec))) {
    errors.push('spec must be an object if provided');
  }

  // Validar arrays opcionais
  const optionalArrays = ['planWarnings', 'appliedEdits'] as const;
  for (const key of optionalArrays) {
    if (obj[key] !== undefined && !Array.isArray(obj[key])) {
      errors.push(`${key} must be an array if provided`);
    }
  }

  // Validar strings opcionais
  const optionalStrings = ['assistantSummary', 'error'] as const;
  for (const key of optionalStrings) {
    if (obj[key] !== undefined && typeof obj[key] !== 'string') {
      errors.push(`${key} must be a string if provided`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: data as GenerationResult,
  };
}

// ✅ SSOT: Usar CompilerPhase de types.ts
export type NewGamePhase = Exclude<CompilerPhase, "interpretation" | "validation" | "confirmation"> | "spec";

function extractFirstJsonObject(text: string): string | null {
  // Validate input
  if (!isValidString(text)) {
    return null;
  }
  
  // Usar regex para encontrar JSON objects ou arrays
  const jsonRegex = /(\{[\s\S]*?\}|\[[\s\S]*?\])/;
  const match = text.match(jsonRegex);
  
  if (!match) {
    return null;
  }
  
  const candidate = match[0];
  
  // Validar JSON com try/catch para melhor performance
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    return null;
  }
}

export async function generateWithStreaming(
  messages: ChatMsg[],
  currentSpec?: OrdaxSpec,
  projectFiles?: GeneratedFile[],
  onChunk?: StreamCallback
): Promise<{ result?: GenerationResult; error?: string }> {
  try {
    // Validate messages
    const validation = validateMessages(messages);
    if (!validation.valid) {
      return { error: validation.error };
    }
    
    // Call streaming function
    const { data, error } = await supabase.functions.invoke(SUPABASE_FUNCTIONS.GAME_AI_CHAT_STREAM, {
      body: { 
        messages, 
        currentSpec, 
        projectFiles,
        sessionId: options?.sessionId,
        approvedPlan: options?.approvedPlan,
        approvedPlanHuman: options?.approvedPlanHuman,
      },
    });

    if (error) {
      return { error: error.message };
    }
    
    // Validate data exists
    if (!data) {
      return { error: ERROR_MESSAGES.NO_DATA_RECEIVED };
    }

    // For now, handle non-streaming response
    // In production, implement SSE client
    const fullResponse = data?.response || "";
    
    // Validate response is string
    if (typeof fullResponse !== "string") {
      return { error: ERROR_MESSAGES.INVALID_RESPONSE_TYPE };
    }

    // Se onChunk for fornecido, usar StreamingClient real
    if (onChunk) {
      const client = new StreamingClient();
      let result: GenerationResult | undefined;
      let streamError: string | undefined;
      
      await client.stream(
        messages,
        currentSpec,
        projectFiles,
        onChunk,
        (res) => { result = res; },
        (err) => { streamError = err; }
      );
      
      if (streamError) {
        return { error: streamError };
      }
      
      if (result) {
        return { result };
      }
      
      return { error: ERROR_MESSAGES.NO_DATA_RECEIVED };
    }

    // Parse and validate response
    const parseResult = safeJsonParse(fullResponse);
    
    if (!parseResult.success) {
      const errorMsg = "error" in parseResult ? parseResult.error : ERROR_MESSAGES.PARSE_FAILED;
      return { error: errorMsg };
    }
    
    // Validar estrutura da resposta
    const validationResult = validateGenerationResult(parseResult.data);
    
    if (!validationResult.valid) {
      return { 
        error: `Invalid response format: ${validationResult.errors?.join(', ')}` 
      };
    }
    
    return { result: validationResult.data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// SSE Client for true streaming
export class StreamingClient {
  private abortController: AbortController | null = null;
  private isStreaming = false;
  private metrics = new MetricsTracker();
  private requestQueue = new RequestQueue();
  private reconnectAttempts = 0;
  private cleanupCallbacks: (() => void)[] = [];
  
  constructor() {
    // Setup cleanup on page unload
    if (typeof window !== 'undefined') {
      const cleanupHandler = () => this.cleanup();
      window.addEventListener('beforeunload', cleanupHandler);
      this.cleanupCallbacks.push(() => {
        window.removeEventListener('beforeunload', cleanupHandler);
      });
    }
  }
  
  private cleanup() {
    this.cancel();
    this.cleanupCallbacks.forEach(cb => cb());
    this.cleanupCallbacks = [];
  }

  private safeParseJson(text: string): unknown | null {
    const result = safeJsonParse(text);
    return result.success ? result.data : null;
  }

  /**
   * Stream with automatic retry and timeout
   */
  async streamWithRetry(
    messages: ChatMsg[],
    currentSpec?: OrdaxSpec,
    projectFiles?: GeneratedFile[],
    onChunk?: StreamCallback,
    onComplete?: (result: GenerationResult) => void,
    onError?: (error: string) => void,
    options?: {
      phase?: NewGamePhase;
      approvedPlan?: unknown;
      approvedPlanHuman?: string;
      mode?: "spec" | "code_patch";
      targetGameId?: string;
      sessionId?: string;
      timeout?: number;
      maxRetries?: number;
      onRetry?: (attempt: number) => void;
      onProgress?: (progress: number) => void;
    }
  ): Promise<void> {
    const timeout = options?.timeout ?? TIMEOUT.STREAMING_MS;
    const maxRetries = options?.maxRetries ?? RETRY.MAX_ATTEMPTS;
    
    try {
      await retryWithBackoff(
        async () => {
          return await withTimeout(
            this.stream(
              messages,
              currentSpec,
              projectFiles,
              onChunk,
              onComplete,
              onError,
              options
            ),
            timeout,
            `Request timeout after ${timeout}ms`
          );
        },
        {
          maxAttempts: maxRetries,
          onRetry: (attempt, error) => {
            console.warn(`[StreamingClient] Retry attempt ${attempt}/${maxRetries}`, error);
            options?.onRetry?.(attempt);
          },
          shouldRetry: (error) => {
            // Don't retry if user cancelled
            if (error instanceof DOMException && error.name === "AbortError") {
              return false;
            }
            return isRetryableError(error);
          },
        }
      );
    } catch (error) {
      onError?.(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Stream with request queue (prevents concurrent requests)
   */
  async streamQueued(
    messages: ChatMsg[],
    currentSpec?: OrdaxSpec,
    projectFiles?: GeneratedFile[],
    onChunk?: StreamCallback,
    onComplete?: (result: GenerationResult) => void,
    onError?: (error: string) => void,
    options?: {
      phase?: NewGamePhase;
      approvedPlan?: unknown;
      approvedPlanHuman?: string;
      mode?: "spec" | "code_patch";
      targetGameId?: string;
      sessionId?: string;
      timeout?: number;
      maxRetries?: number;
      onRetry?: (attempt: number) => void;
      onProgress?: (progress: number) => void;
    }
  ): Promise<void> {
    try {
      await this.requestQueue.enqueue(async () => {
        await this.streamWithRetry(
          messages,
          currentSpec,
          projectFiles,
          onChunk,
          onComplete,
          onError,
          options
        );
      });
    } catch (error) {
      onError?.(error instanceof Error ? error.message : String(error));
    }
  }

  async stream(
    messages: ChatMsg[],
    currentSpec?: OrdaxSpec,
    projectFiles?: GeneratedFile[],
    onChunk?: StreamCallback,
    onComplete?: (result: GenerationResult) => void,
    onError?: (error: string) => void,
    options?: {
      phase?: NewGamePhase;
      approvedPlan?: unknown;
      approvedPlanHuman?: string;
      mode?: "spec" | "code_patch";
      targetGameId?: string;
      sessionId?: string;
      onProgress?: (progress: number) => void;
    }
  ) {
    // Start metrics tracking
    if (METRICS.ENABLED) {
      this.metrics.start();
    }
    
    // Progress tracker
    const progressTracker = options?.onProgress ? new ProgressTracker(options.onProgress) : null;
    
    try {
      // Validate messages
      const validation = validateMessages(messages);
      if (!validation.valid) {
        onError?.(validation.error!);
        return;
      }
      
      // Prevent race condition: only one stream at a time
      if (this.isStreaming) {
        this.cancel();
      }
      this.isStreaming = true;
      
      // Get token (optional for now)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Get environment variables
      const baseUrl =
        (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
        ((globalThis as Record<string, unknown>).VITE_SUPABASE_URL as string | undefined) ??
        (typeof process !== "undefined" ? ((process.env as Record<string, unknown>)?.VITE_SUPABASE_URL as string | undefined) : undefined);
      const anonKey =
        (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
        (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
        ((globalThis as Record<string, unknown>).VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
        ((globalThis as Record<string, unknown>).VITE_SUPABASE_ANON_KEY as string | undefined) ??
        (typeof process !== "undefined"
          ? ((process.env as Record<string, unknown>)?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)
          ?? ((process.env as Record<string, unknown>)?.VITE_SUPABASE_ANON_KEY as string | undefined)
          : undefined);
      
      // Validate environment variables
      const envValidation = validateEnvVars(baseUrl, anonKey);
      if (!envValidation.valid) {
        onError?.(envValidation.error!);
        this.isStreaming = false;
        return;
      }

      // Construct URL safely
      let url: URL;
      try {
        url = new URL(`${baseUrl}${API_PATHS.GAME_AI_CHAT_STREAM}`);
      } catch (error) {
        onError?.(ERROR_MESSAGES.INVALID_URL_FORMAT);
        this.isStreaming = false;
        return;
      }

      // Cancel any previous in-flight stream
      this.abortController?.abort();
      this.abortController = new AbortController();

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.CONTENT_TYPE_JSON,
          [HTTP_HEADERS.API_KEY]: anonKey!,
          [HTTP_HEADERS.AUTHORIZATION]: `Bearer ${token ?? anonKey}`,
        },
        signal: this.abortController.signal,
        body: JSON.stringify({ 
          messages, 
          currentSpec, 
          projectFiles,
          ...(options ?? {})
        }),
      });

      if (!response.ok) {
        let details = "";
        try {
          details = await response.text();
        } catch (readError) {
          console.error("[StreamingClient] Failed to read error response:", readError);
        }

        const parsed = details ? this.safeParseJson(details) : null;
        const engineLimitationsHit = Array.isArray((parsed as Record<string, unknown>)?.engineLimitationsHit)
          ? ((parsed as Record<string, unknown>).engineLimitationsHit as unknown[])
          : undefined;
        const sessionId = options?.sessionId;
        console.error("[StreamingClient] ❌ game-ai-chat-stream HTTP error", {
          status: response.status,
          statusText: response.statusText,
          sessionId,
          engineLimitationsHit,
          body: parsed ?? details?.slice(0, ERROR_DETAILS.MAX_BODY_LENGTH),
        });

        this.isStreaming = false;
        onError?.(
          `HTTP ${response.status} ${response.statusText}${details ? ` — ${details.slice(0, ERROR_DETAILS.MAX_MESSAGE_LENGTH)}` : ""}`
        );
        return;
      }

      let fullResponse = "";

      // Compat: hoje o backend pode retornar JSON (ex: { raw: "..." }) em vez de SSE.
      const contentType = response.headers.get(HTTP_HEADERS.CONTENT_TYPE.toLowerCase()) ?? "";
      if (contentType.includes(HTTP_HEADERS.CONTENT_TYPE_JSON)) {
        const payload = await response.json().catch(() => null);
        const raw =
          typeof (payload as Record<string, unknown>)?.raw === "string"
            ? ((payload as Record<string, unknown>).raw as string)
            : typeof (payload as Record<string, unknown>)?.response === "string"
              ? ((payload as Record<string, unknown>).response as string)
              : payload
                ? JSON.stringify(payload)
                : "";

        fullResponse = raw;
        if (raw) {
          onChunk?.(raw);
          if (METRICS.ENABLED) {
            this.metrics.trackChunk(raw);
          }
        }
      } else {
        // Stream processing with proper cleanup
        const reader = response.body?.getReader();
        
        if (!reader) {
          this.isStreaming = false;
          onError?.(ERROR_MESSAGES.NO_READER_AVAILABLE);
          return;
        }

        try {
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Validate value
            if (!isValidStreamValue(value)) {
              continue;
            }

            buffer += decoder.decode(value, { stream: true });

            let newlineIndex: number;
            while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIndex);
              buffer = buffer.slice(newlineIndex + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line || line.startsWith(STREAMING.SSE_COMMENT_PREFIX)) continue;
              if (!line.startsWith(STREAMING.SSE_DATA_PREFIX)) continue;

              const jsonStr = line.slice(STREAMING.SSE_DATA_PREFIX.length).trim();
              if (!jsonStr || jsonStr === STREAMING.SSE_DONE_MARKER) continue;

              // Validate JSON before parsing
              if (!isValidJsonString(jsonStr)) {
                // Incomplete JSON: put it back and wait for more.
                buffer = line + "\n" + buffer;
                break;
              }

              const parseResult = safeJsonParse(jsonStr);
              if (parseResult.success) {
                const parsed = parseResult.data as Record<string, unknown>;
                const choices = parsed.choices as Array<Record<string, unknown>> | undefined;
                const delta = choices?.[0]?.delta as Record<string, unknown> | undefined;
                const content = delta?.content as string | undefined;
                if (content) {
                  fullResponse += content;
                  onChunk?.(content);
                  
                  // Track metrics
                  if (METRICS.ENABLED) {
                    this.metrics.trackChunk(content);
                  }
                  
                  // Update progress (estimate based on chunks)
                  progressTracker?.increment(1);
                }
              } else {
                // Incomplete JSON: put it back and wait for more.
                buffer = line + "\n" + buffer;
                break;
              }
            }
          }
        } finally {
          // ✅ CRITICAL: Always release reader lock
          reader.releaseLock();
        }
      }

      // Parse final response
      const jsonCandidate = extractFirstJsonObject(fullResponse) ?? fullResponse;
      
      if (!isValidJsonString(jsonCandidate)) {
        this.isStreaming = false;
        onError?.(ERROR_MESSAGES.PARSE_FINAL_RESPONSE_FAILED);
        return;
      }
      
      const parseResult = safeJsonParse(jsonCandidate);
      
      if (!parseResult.success) {
        this.isStreaming = false;
        const errorMsg = "error" in parseResult ? parseResult.error : ERROR_MESSAGES.PARSE_FAILED;
        onError?.(errorMsg);
        return;
      }
      
      const parsed = parseResult.data as Record<string, unknown>;

      if (parsed?.error) {
        this.isStreaming = false;
        onError?.(typeof parsed?.message === "string" ? parsed.message : String(parsed.error));
        return;
      }

      const spec = parsed?.spec ? (parsed.spec as OrdaxSpec) : undefined;
      const patch = parsed?.patch as CodeSemanticPatch | undefined;
      const planWarnings = Array.isArray(parsed?.planWarnings)
        ? parsed.planWarnings.filter((s: unknown) => typeof s === "string")
        : undefined;
      const assistantSummary = typeof parsed?.assistantSummary === "string" ? parsed.assistantSummary : undefined;
      const appliedEdits = Array.isArray(parsed?.appliedEdits)
        ? parsed.appliedEdits.filter((s: unknown) => typeof s === "string")
        : undefined;
      
      this.isStreaming = false;
      
      // End metrics tracking
      if (METRICS.ENABLED) {
        this.metrics.end();
        if (METRICS.LOG_PERFORMANCE) {
          this.metrics.log("[StreamingClient]");
        }
      }
      
      // Complete progress
      progressTracker?.setTotal(100);
      progressTracker?.increment(100);
      
      onComplete?.({
        files: Array.isArray(parsed.files) ? parsed.files : [],
        spec,
        patch,
        planWarnings,
        assistantSummary,
        appliedEdits,
        semanticPatch: parsed?.semanticPatch as Record<string, unknown> | undefined,
        report: parsed?.report as Record<string, unknown> | undefined,
        engineGapReport: parsed?.engineGapReport as Record<string, unknown> | undefined,
        fullResponse,
      });
    } catch (error) {
      this.isStreaming = false;
      
      // Log error metrics
      if (METRICS.ENABLED && METRICS.LOG_ERRORS) {
        console.error("[StreamingClient] Error:", error);
      }
      
      // If user cancelled, do not treat as error.
      if (error instanceof DOMException && error.name === "AbortError") {
        console.log("[StreamingClient] Stream cancelled by user");
        return;
      }
      
      // Check if should reconnect
      if (isRetryableError(error) && this.reconnectAttempts < RECONNECT.MAX_ATTEMPTS) {
        this.reconnectAttempts++;
        
        // Use RETRY constants for exponential backoff
        const baseDelay = RETRY.INITIAL_DELAY_MS;
        const maxDelay = RETRY.MAX_DELAY_MS;
        const delay = Math.min(
          baseDelay * Math.pow(RETRY.BACKOFF_MULTIPLIER, this.reconnectAttempts - 1),
          maxDelay
        );
        
        console.warn(`[StreamingClient] Reconnecting (${this.reconnectAttempts}/${RECONNECT.MAX_ATTEMPTS}) in ${delay}ms...`);
        
        await sleep(delay);
        
        // Retry the stream with current state
        // Usar setTimeout para evitar stack overflow
        setTimeout(() => {
          this.stream(
            messages,
            currentSpec,
            projectFiles,
            onChunk,
            onComplete,
            onError,
            options
          ).catch(err => {
            console.error('[StreamingClient] Retry failed:', err);
            onError?.(err instanceof Error ? err.message : String(err));
          });
        }, 0);
        
        return;
      }
      
      // Reset reconnect attempts on non-retryable error
      this.reconnectAttempts = 0;
      
      onError?.(error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return this.metrics.getMetrics();
  }
  
  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.requestQueue.size();
  }
  
  /**
   * Clear request queue
   */
  clearQueue(): void {
    this.requestQueue.clear();
  }

  cancel() {
    this.isStreaming = false;
    this.reconnectAttempts = 0;
    this.abortController?.abort();
    this.abortController = null;
  }
}
