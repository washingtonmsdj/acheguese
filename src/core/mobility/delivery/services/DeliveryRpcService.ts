import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

export type DeliveryRpcAction =
  | "createOrder"
  | "transitionLogisticsStatus"
  | "markPickedUp"
  | "attachDeliveryProof"
  | "markDelivered"
  | "transitionFinancialStatus"
  | "updateOrderNotes"
  | "updateOrderSourceMetadata"
  | "reportOccurrence"
  | "resolveOccurrence";

const FUNCTION_NAME = "delivery-rpc";
const SERVICE_NAME = "DeliveryRpcService";

export class DeliveryRpcService {
  static async invoke<T>(
    action: DeliveryRpcAction,
    params: Record<string, unknown>,
  ): Promise<T> {
    return invokeSupabaseBroker<T, DeliveryRpcAction>({
      action,
      functionName: FUNCTION_NAME,
      noDataMessage: "Delivery broker returned no data",
      params,
      serviceName: SERVICE_NAME,
    });
  }
}
