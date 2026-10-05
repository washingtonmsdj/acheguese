import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
  type SupabaseClient,
} from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export type SupabaseBrokerClient = Pick<SupabaseClient, "functions">;

export interface SupabaseBrokerResponse<T> {
  data?: T;
  error?: string;
}

interface InvokeSupabaseBrokerInput<TAction extends string> {
  action: TAction;
  client?: SupabaseBrokerClient;
  functionName: string;
  noDataMessage?: string;
  params?: object;
  serviceName: string;
  timeoutMs?: number;
}

function hasBrokerData<T>(
  response: SupabaseBrokerResponse<T> | null | undefined,
): response is SupabaseBrokerResponse<T> & { data: T } {
  return Boolean(response) && Object.prototype.hasOwnProperty.call(response, "data");
}

function resolveBrokerSignal(timeoutMs?: number): AbortSignal | undefined {
  if (timeoutMs === undefined) return undefined;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("Supabase broker timeoutMs must be a positive finite number");
  }
  return AbortSignal.timeout(timeoutMs);
}

async function invokeRawSupabaseBroker<T, TAction extends string>({
  action,
  client,
  functionName,
  params = {},
  serviceName,
  timeoutMs,
}: InvokeSupabaseBrokerInput<TAction>): Promise<SupabaseBrokerResponse<T> | null> {
  const brokerClient = client ?? supabase;
  const signal = resolveBrokerSignal(timeoutMs);
  const { data, error } = await brokerClient.functions.invoke<SupabaseBrokerResponse<T>>(
    functionName,
    {
      body: { action, params },
      ...(signal ? { signal } : {}),
    },
  );

  if (error) {
    const message =
      (await resolveSupabaseFunctionErrorMessage(error)) ??
      "Edge Function invocation failed";
    logger.warn(`[${serviceName}] broker invocation failed`, {
      action,
      message,
    });
    throw new Error(message);
  }

  if (data?.error) {
    logger.warn(`[${serviceName}] broker rejected action`, {
      action,
      message: data.error,
    });
    throw new Error(data.error);
  }

  return data ?? null;
}

export async function invokeSupabaseBroker<T, TAction extends string>(
  input: InvokeSupabaseBrokerInput<TAction>,
): Promise<T> {
  const response = await invokeRawSupabaseBroker<T, TAction>(input);

  if (!hasBrokerData(response)) {
    throw new Error(input.noDataMessage ?? `${input.serviceName} broker returned no data`);
  }

  return response.data;
}

/**
 * Invokes a mutation-style broker and requires an explicit, non-null `data`
 * acknowledgement. A bare HTTP 2xx is not proof that a server-side command
 * actually produced the authoritative mutation receipt expected by callers.
 */
export async function invokeSupabaseBrokerCommand<TAction extends string>(
  input: InvokeSupabaseBrokerInput<TAction>,
): Promise<void> {
  const response = await invokeRawSupabaseBroker<unknown, TAction>(input);
  if (!hasBrokerData(response) || response.data === null || response.data === undefined) {
    throw new Error(
      input.noDataMessage ?? `${input.serviceName} broker returned no command acknowledgement`,
    );
  }
}

export async function invokeNullableSupabaseBroker<T, TAction extends string>(
  input: InvokeSupabaseBrokerInput<TAction>,
): Promise<T | null> {
  try {
    const response = await invokeRawSupabaseBroker<T, TAction>(input);
    return hasBrokerData(response) ? response.data : null;
  } catch {
    return null;
  }
}
