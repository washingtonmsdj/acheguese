import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

type ProfileRpcAction =
  | "createProfile"
  | "updateHandle"
  | "deleteProfile"
  | "transferOwnership"
  | "inviteMemberByEmail";

const FUNCTION_NAME = "profile-rpc";
const SERVICE_NAME = "ProfileRpcService";

export class ProfileRpcService {
  private static async invoke<T>(
    action: ProfileRpcAction,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    return invokeSupabaseBroker<T, ProfileRpcAction>({
      action,
      functionName: FUNCTION_NAME,
      noDataMessage: "Profile broker returned no data",
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async createProfile<TResult>(params: {
    profileType: string;
    handle: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    extensionData?: Record<string, unknown> | null;
  }): Promise<TResult> {
    return this.invoke<TResult>("createProfile", params);
  }

  static async updateHandle<TResult>(profileId: string, newHandle: string): Promise<TResult> {
    return this.invoke<TResult>("updateHandle", { profileId, newHandle });
  }

  static async deleteProfile<TResult>(profileId: string): Promise<TResult> {
    return this.invoke<TResult>("deleteProfile", { profileId });
  }

  static async transferOwnership<TResult>(
    profileId: string,
    newOwnerUserId: string,
  ): Promise<TResult> {
    return this.invoke<TResult>("transferOwnership", { profileId, newOwnerUserId });
  }

  static async inviteMemberByEmail<TResult>(
    profileId: string,
    email: string,
    role: string,
  ): Promise<TResult> {
    return this.invoke<TResult>("inviteMemberByEmail", { profileId, email, role });
  }
}
