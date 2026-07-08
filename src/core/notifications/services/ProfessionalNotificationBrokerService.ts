import { invokeNullableSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

export type ProfessionalNotificationAction = "leadMessage" | "leadQuote";

export interface ProfessionalNotificationParams {
  messageId?: string;
  quoteId?: string;
}

const FUNCTION_NAME = "professional-notifications-rpc";
const SERVICE_NAME = "ProfessionalNotificationBrokerService";

export class ProfessionalNotificationBrokerService {
  static async notify(
    action: ProfessionalNotificationAction,
    params: ProfessionalNotificationParams,
  ): Promise<unknown | null> {
    return invokeNullableSupabaseBroker<unknown, ProfessionalNotificationAction>({
      action,
      functionName: FUNCTION_NAME,
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async notifyLeadMessage(messageId: string): Promise<unknown | null> {
    return this.notify("leadMessage", { messageId });
  }

  static async notifyLeadQuote(quoteId: string): Promise<unknown | null> {
    return this.notify("leadQuote", { quoteId });
  }
}
