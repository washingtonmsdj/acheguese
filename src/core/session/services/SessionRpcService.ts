import { invokeNullableSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

export type SessionRpcAction =
  | "getActiveProfile"
  | "switchActiveProfile"
  | "checkMfaRequired"
  | "revokeSession"
  | "revokeAllSessions"
  | "updateSessionActivity";

export interface SessionRpcProfileRow {
  id: string;
  user_id: string;
  name: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  profile_type: string;
  city: string | null;
  neighborhood: string | null;
  state: string | null;
  street?: string | null;
  telefone: string | null;
  whatsapp: string | null;
  location_id: string | null;
  is_active: boolean;
  verified: boolean | null;
  created_at: string;
}

interface ActiveProfileBrokerData {
  profile: SessionRpcProfileRow | null;
}

interface SwitchProfileBrokerData {
  ok: boolean;
}

interface MfaRequiredBrokerData {
  required: boolean;
}

interface RevokeSessionBrokerData {
  revoked: boolean;
}

interface RevokeAllSessionsBrokerData {
  revokedCount: number;
}

interface UpdateSessionActivityBrokerData {
  updated: boolean;
}

const FUNCTION_NAME = "session-rpc";
const SERVICE_NAME = "SessionRpcService";

export class SessionRpcService {
  private static async invoke<T>(
    action: SessionRpcAction,
    params: Record<string, unknown> = {},
  ): Promise<T | null> {
    return invokeNullableSupabaseBroker<T, SessionRpcAction>({
      action,
      functionName: FUNCTION_NAME,
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async getActiveProfile(): Promise<SessionRpcProfileRow | null> {
    const result = await this.invoke<ActiveProfileBrokerData>("getActiveProfile");
    return result?.profile ?? null;
  }

  static async switchActiveProfile(profileId: string): Promise<boolean> {
    const result = await this.invoke<SwitchProfileBrokerData>("switchActiveProfile", {
      profileId,
    });
    return result?.ok === true;
  }

  static async checkMfaRequired(): Promise<boolean | null> {
    const result = await this.invoke<MfaRequiredBrokerData>("checkMfaRequired");
    return result?.required ?? null;
  }

  static async revokeSession(sessionId: string, reason?: string): Promise<boolean> {
    const result = await this.invoke<RevokeSessionBrokerData>("revokeSession", {
      sessionId,
      reason,
    });
    return result?.revoked === true;
  }

  static async revokeAllSessions(exceptCurrent = true, reason?: string): Promise<number> {
    const result = await this.invoke<RevokeAllSessionsBrokerData>("revokeAllSessions", {
      exceptCurrent,
      reason,
    });
    return result?.revokedCount ?? 0;
  }

  static async updateSessionActivity(): Promise<boolean> {
    const result = await this.invoke<UpdateSessionActivityBrokerData>("updateSessionActivity");
    return result?.updated === true;
  }
}
