// Shared Lovable AI Gateway helper for all edge functions.
// SSOT for: header building, retry/backoff, error mapping, usage logging.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAllSecurityHeaders } from "../_shared/security.ts";

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export function getAiCorsHeaders(req?: Request): Record<string, string> {
  return getAllSecurityHeaders("POST, OPTIONS", req);
}

export type AiCapability = "text" | "structured" | "vision" | "image" | "embed" | "moderation";

export interface AiCallOptions {
  feature: string;
  capability: AiCapability;
  userId?: string;
  body: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface AiCallResult {
  ok: boolean;
  status: number;
  data: unknown;
  errorCode?: "unauthorized" | "payment_required" | "rate_limited" | "bad_request" | "server_error" | "network";
  errorMessage?: string;
  latencyMs: number;
  requestId?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getGatewayErrorMessage(data: unknown, fallbackText: string, status: number): string {
  const record = asRecord(data);
  const nestedError = asRecord(record?.error);
  const nestedMessage = nestedError?.message;
  if (typeof nestedMessage === "string" && nestedMessage) {
    return nestedMessage;
  }

  const directMessage = record?.message;
  if (typeof directMessage === "string" && directMessage) {
    return directMessage;
  }

  return fallbackText.slice(0, 240) || `HTTP ${status}`;
}

function getUsageMetrics(data: unknown): {
  promptTokens?: number | null;
  completionTokens?: number | null;
} {
  const record = asRecord(data);
  const usage = asRecord(record?.usage);
  return {
    promptTokens: typeof usage?.prompt_tokens === "number" ? usage.prompt_tokens : null,
    completionTokens:
      typeof usage?.completion_tokens === "number" ? usage.completion_tokens : null,
  };
}

function getApiKey(): string {
  const raw = Deno.env.get("LOVABLE_API_KEY");
  if (!raw) throw new Error("LOVABLE_API_KEY não configurada no backend.");
  const key = raw.trim();
  if (!key) throw new Error("LOVABLE_API_KEY vazia.");
  return key;
}

/** Faz a chamada ao gateway com retry exponencial em 429 e mapeamento padronizado de erros. */
export async function callAiGateway(opts: AiCallOptions): Promise<AiCallResult> {
  const start = Date.now();
  const apiKey = getApiKey();

  let attempt = 0;
  const maxAttempts = 3;
  let lastErr: AiCallResult | null = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const resp = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(opts.body),
        signal: opts.signal,
      });

      const text = await resp.text();
      let data: unknown = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
      }

      const requestId = resp.headers.get("x-request-id") ?? undefined;
      const latencyMs = Date.now() - start;

      if (resp.ok) {
        return { ok: true, status: resp.status, data, latencyMs, requestId };
      }

      const errorMessage = getGatewayErrorMessage(data, text, resp.status);

      if (resp.status === 401) {
        return {
          ok: false,
          status: 401,
          data,
          errorCode: "unauthorized",
          errorMessage:
            "Chave da Lovable AI inválida. Rotacione LOVABLE_API_KEY no painel da Lovable Cloud.",
          latencyMs,
          requestId,
        };
      }
      if (resp.status === 402) {
        return {
          ok: false,
          status: 402,
          data,
          errorCode: "payment_required",
          errorMessage: "Créditos da Lovable AI esgotados. Adicione créditos no workspace.",
          latencyMs,
          requestId,
        };
      }
      if (resp.status === 429) {
        // backoff e retry
        const wait = 500 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, wait));
        lastErr = {
          ok: false,
          status: 429,
          data,
          errorCode: "rate_limited",
          errorMessage: "Limite de requisições atingido. Tente novamente em instantes.",
          latencyMs,
          requestId,
        };
        continue;
      }
      if (resp.status >= 400 && resp.status < 500) {
        return {
          ok: false,
          status: resp.status,
          data,
          errorCode: "bad_request",
          errorMessage,
          latencyMs,
          requestId,
        };
      }

      return {
        ok: false,
        status: resp.status,
        data,
        errorCode: "server_error",
        errorMessage,
        latencyMs,
        requestId,
      };
    } catch (err) {
      lastErr = {
        ok: false,
        status: 0,
        data: null,
        errorCode: "network",
        errorMessage: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - start,
      };
      // retry só faz sentido em problemas temporários
      const wait = 400 * attempt;
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  return lastErr ?? {
    ok: false,
    status: 0,
    data: null,
    errorCode: "network",
    errorMessage: "Falha desconhecida ao chamar a Lovable AI.",
    latencyMs: Date.now() - start,
  };
}

/** Grava telemetria em ai_usage_log. Nunca quebra o fluxo principal se falhar. */
export async function logAiUsage(
  admin: SupabaseClient,
  params: {
    userId?: string;
    feature: string;
    capability: AiCapability;
    model: string;
    result: AiCallResult;
    tokensIn?: number;
    tokensOut?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const status = params.result.ok
      ? "ok"
      : params.result.errorCode === "rate_limited"
        ? "rate_limited"
        : params.result.errorCode === "payment_required"
          ? "payment_required"
          : "error";

    const usage = getUsageMetrics(params.result.data);
    await admin.from("ai_usage_log").insert({
      user_id: params.userId ?? null,
      feature: params.feature,
      capability: params.capability,
      model: params.model,
      status,
      tokens_in: params.tokensIn ?? usage.promptTokens ?? null,
      tokens_out: params.tokensOut ?? usage.completionTokens ?? null,
      latency_ms: params.result.latencyMs,
      request_id: params.result.requestId ?? null,
      error_code: params.result.errorCode ?? null,
      error_message: params.result.errorMessage ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    console.warn("[ai] logAiUsage falhou", err);
  }
}

/** Cria os clients (user-bound + admin) e resolve o user a partir do header Authorization. */
export async function getUserAndAdmin(req: Request): Promise<{
  user: { id: string } | null;
  admin: SupabaseClient;
  userClient: SupabaseClient;
}> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE);

  const { data } = await userClient.auth.getUser();
  return { user: data?.user ? { id: data.user.id } : null, admin, userClient };
}

/** Helper: resposta JSON padronizada com CORS. */
export function jsonResponse(body: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getAiCorsHeaders(req), "Content-Type": "application/json" },
  });
}

/** Mapeia o resultado do gateway para uma Response HTTP coerente para o cliente. */
export function mapGatewayErrorToResponse(result: AiCallResult, req?: Request): Response {
  if (result.ok) return jsonResponse({ ok: true }, 200, req);
  const status =
    result.errorCode === "unauthorized"
      ? 401
      : result.errorCode === "payment_required"
        ? 402
        : result.errorCode === "rate_limited"
          ? 429
          : result.errorCode === "bad_request"
            ? 400
            : 500;
  return jsonResponse(
    {
      error: result.errorMessage ?? "Falha na IA.",
      code: result.errorCode ?? "server_error",
      requestId: result.requestId ?? null,
    },
    status,
    req,
  );
}
