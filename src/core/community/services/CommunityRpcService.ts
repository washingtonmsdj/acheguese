import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

type CommunityRpcAction =
  | "createAlert"
  | "createIssue"
  | "incrementAlertEditCount"
  | "markBestAnswer";

const FUNCTION_NAME = "community-rpc";
const SERVICE_NAME = "CommunityRpcService";

export class CommunityRpcService {
  private static async invoke<T>(
    action: CommunityRpcAction,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    return invokeSupabaseBroker<T, CommunityRpcAction>({
      action,
      functionName: FUNCTION_NAME,
      noDataMessage: "Community broker returned no data",
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async createAlert<TResult>(payload: Record<string, unknown>): Promise<TResult> {
    return this.invoke<TResult>("createAlert", { payload });
  }

  static async createIssue<TResult>(payload: Record<string, unknown>): Promise<TResult> {
    return this.invoke<TResult>("createIssue", { payload });
  }

  static async incrementAlertEditCount(alertId: string): Promise<void> {
    await this.invoke<{ incremented: boolean }>("incrementAlertEditCount", { alertId });
  }

  static async markBestAnswer(questionId: string, answerId: string): Promise<void> {
    await this.invoke<{ marked: boolean }>("markBestAnswer", { questionId, answerId });
  }
}
