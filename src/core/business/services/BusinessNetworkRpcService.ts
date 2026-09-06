import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

type BusinessNetworkRpcAction =
  | "convertToNetwork"
  | "createBranch"
  | "setHeadquarters";

interface BrokerEnvelope<T> {
  success: true;
  data: T;
}

export interface ConvertNetworkCommandResult {
  brand_hub_id: string;
  brand_hub_business_id: string;
  first_branch_id: string;
  first_branch_profile_id: string;
}

export interface CreateBranchCommandResult {
  branch_id: string;
  branch_profile_id: string;
  brand_hub_business_id: string;
}

const FUNCTION_NAME = "business-network-rpc";
const SERVICE_NAME = "BusinessNetworkRpcService";

export class BusinessNetworkRpcService {
  private static async invoke<T>(
    action: BusinessNetworkRpcAction,
    params: Record<string, unknown>,
  ): Promise<T> {
    const envelope = await invokeSupabaseBroker<BrokerEnvelope<T>, BusinessNetworkRpcAction>({
      action,
      functionName: FUNCTION_NAME,
      noDataMessage: "Business network broker returned no data",
      params,
      serviceName: SERVICE_NAME,
    });

    if (!envelope?.success || !envelope.data) {
      throw new Error("Business network command failed");
    }

    return envelope.data;
  }

  static convertToNetwork(params: {
    standaloneProfileId: string;
    brandName: string;
    unitName: string;
  }): Promise<ConvertNetworkCommandResult> {
    return this.invoke<ConvertNetworkCommandResult>("convertToNetwork", params);
  }

  static createBranch(params: {
    brandHubId: string;
    businessName: string;
    unitName: string;
    slug: string;
    locationId: string;
    isHeadquarters?: boolean;
  }): Promise<CreateBranchCommandResult> {
    return this.invoke<CreateBranchCommandResult>("createBranch", params);
  }

  static setHeadquarters(
    brandHubId: string,
    branchId: string,
  ): Promise<{ brand_hub_business_id: string; headquarters_branch_id: string }> {
    return this.invoke("setHeadquarters", { brandHubId, branchId });
  }
}
