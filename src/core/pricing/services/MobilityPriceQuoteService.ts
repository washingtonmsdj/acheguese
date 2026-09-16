import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

export type MobilityPriceQuoteMode = "ride" | "motoboy";

export interface MobilityPriceQuote {
  quote_id: string;
  mode: MobilityPriceQuoteMode;
  amount: number;
  currency: "BRL";
  distance_meters: number;
  duration_seconds: number;
  expires_at: string;
  pricing_rule_id: string;
  quote_engine_version: string;
}

export interface MobilityPriceQuoteInput {
  passengerProfileId: string;
  mode: MobilityPriceQuoteMode;
  pickupAddressId: string;
  dropoffAddressId: string;
}

const FUNCTION_NAME = "mobility-pricing-rpc";
const SERVICE_NAME = "MobilityPriceQuoteService";

export class MobilityPriceQuoteService {
  static async issue(input: MobilityPriceQuoteInput): Promise<MobilityPriceQuote> {
    const quote = await invokeSupabaseBroker<MobilityPriceQuote, "quote">({
      action: "quote",
      functionName: FUNCTION_NAME,
      noDataMessage: "Mobility pricing broker returned no quote",
      params: input,
      serviceName: SERVICE_NAME,
    });

    if (
      !quote.quote_id ||
      (quote.mode !== "ride" && quote.mode !== "motoboy") ||
      quote.currency !== "BRL" ||
      !Number.isFinite(quote.amount) ||
      quote.amount <= 0 ||
      !Number.isInteger(quote.distance_meters) ||
      quote.distance_meters <= 0 ||
      !Number.isInteger(quote.duration_seconds) ||
      quote.duration_seconds <= 0 ||
      !quote.expires_at ||
      !quote.pricing_rule_id ||
      !quote.quote_engine_version
    ) {
      throw new Error("Mobility pricing broker returned an invalid quote");
    }

    return quote;
  }
}
