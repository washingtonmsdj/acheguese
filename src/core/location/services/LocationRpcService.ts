import { invokeNullableSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

type LocationRpcAction = "upsertCanonicalCityByIbge";

interface UpsertCanonicalCityBrokerData {
  city: {
    city_id: string;
    state_id: string;
  } | null;
}

const FUNCTION_NAME = "location-rpc";
const SERVICE_NAME = "LocationRpcService";

export class LocationRpcService {
  private static async invoke<T>(
    action: LocationRpcAction,
    params: Record<string, unknown> = {},
  ): Promise<T | null> {
    return invokeNullableSupabaseBroker<T, LocationRpcAction>({
      action,
      functionName: FUNCTION_NAME,
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async upsertCanonicalCityByIbge(input: {
    stateCode: string;
    cityName: string;
    ibgeCode: string;
  }): Promise<boolean> {
    const result = await this.invoke<UpsertCanonicalCityBrokerData>(
      "upsertCanonicalCityByIbge",
      input,
    );
    return Boolean(result?.city?.city_id);
  }
}
