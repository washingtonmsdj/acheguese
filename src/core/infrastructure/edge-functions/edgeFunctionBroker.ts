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
}

function hasBrokerData<T>(
  response: SupabaseBrokerResponse<T> | null | undefined,
): response is SupabaseBrokerResponse<T> & { data: T } {
  return Boolean(response) && Object.prototype.hasOwnProperty.call(response, "data");
}

async function invokeRawSupabaseBroker<T, TAction extends string>({
  action,
  client,
  functionName,
  params = {},
  serviceName,
}: InvokeSupabaseBrokerInput<TAction>): Promise<SupabaseBrokerResponse<T> | null> {
  const brokerClient = client ?? supabase;
  const { data, error } = await brokerClient.functions.invoke<SupabaseBrokerResponse<T>>(
    functionName,
    { body: { action, params } },
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

export async function invokeSupabaseBrokerCommand<TAction extends string>(
  input: InvokeSupabaseBrokerInput<TAction>,
): Promise<void> {
  await invokeRawSupabaseBroker<unknown, TAction>(input);
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
