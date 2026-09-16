import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import type {
  CreateDeliveryInput,
  CreateRideInput,
} from "../core/RideOperationalTypes";

const FUNCTION_NAME = "mobility-create-rpc";
const SERVICE_NAME = "MobilityCreationService";

type MobilityCreateAction = "createRide" | "createDelivery";

export interface MobilityCreationReceipt {
  success: boolean;
  ride_id?: string;
  status?: string;
  quote_id?: string;
  reason?: string;
}

export class MobilityCreationService {
  private static async invoke(
    action: MobilityCreateAction,
    params: Record<string, unknown>,
  ): Promise<MobilityCreationReceipt> {
    return invokeSupabaseBroker<MobilityCreationReceipt, MobilityCreateAction>({
      action,
      functionName: FUNCTION_NAME,
      noDataMessage: "Mobility creation broker returned no receipt",
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async createRide(input: CreateRideInput): Promise<MobilityCreationReceipt> {
    if (!input.priceQuoteId?.trim()) {
      throw new Error("Server-owned mobility quote is required");
    }

    return this.invoke("createRide", {
      quoteId: input.priceQuoteId,
      origin: input.origin ?? null,
      destination: input.destination ?? null,
      availableSeats: input.availableSeats ?? 1,
      observation: input.observation ?? null,
      paymentMethod: input.paymentMethod ?? null,
      departureTime: input.departureTime ?? null,
    });
  }

  static async createDelivery(
    input: CreateDeliveryInput,
  ): Promise<MobilityCreationReceipt> {
    if (!input.priceQuoteId?.trim()) {
      throw new Error("Server-owned mobility quote is required");
    }

    return this.invoke("createDelivery", {
      quoteId: input.priceQuoteId,
      origin: input.origin ?? null,
      destination: input.destination ?? null,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      authorizationSourceId: input.authorizationSourceId ?? input.sourceId ?? null,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone ?? null,
      deliveryNotes: input.deliveryNotes ?? null,
      packageDescription: input.packageDescription ?? null,
      packageSize: input.packageSize ?? "small",
      observation: input.observation ?? null,
      paymentMethod: input.paymentMethod ?? null,
      departureTime: input.departureTime ?? null,
    });
  }
}
