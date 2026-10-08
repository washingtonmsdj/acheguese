import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import type { AppRole } from "../types/roles.types";

type RoleRpcAction = "hasRole" | "getUserRoles" | "isAdmin" | "isSuperAdmin";

const FUNCTION_NAME = "role-rpc";
const SERVICE_NAME = "RoleRpcService";

function requireBooleanResponse(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid role-rpc response: ${field} must be a boolean`);
  }
  return value;
}

export class RoleRpcService {
  private static async invoke<T>(
    action: RoleRpcAction,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    return invokeSupabaseBroker<T, RoleRpcAction>({
      action,
      functionName: FUNCTION_NAME,
      noDataMessage: "Role broker returned no data",
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async hasRole(userId: string, role: AppRole): Promise<boolean> {
    const result = await this.invoke<{ hasRole: boolean }>("hasRole", {
      userId,
      role,
    });
    return requireBooleanResponse(result?.hasRole, "hasRole");
  }

  static async getUserRoles(userId: string): Promise<AppRole[]> {
    const result = await this.invoke<{ roles: AppRole[] }>("getUserRoles", {
      userId,
    });
    if (!Array.isArray(result?.roles) || result.roles.some((role) => typeof role !== "string")) {
      throw new Error("Invalid role-rpc response: roles must be an array");
    }
    return result.roles;
  }

  static async isAdmin(userId: string): Promise<boolean> {
    const result = await this.invoke<{ isAdmin: boolean }>("isAdmin", {
      userId,
    });
    return requireBooleanResponse(result?.isAdmin, "isAdmin");
  }

  static async isSuperAdmin(userId: string): Promise<boolean> {
    const result = await this.invoke<{ isSuperAdmin: boolean }>("isSuperAdmin", {
      userId,
    });
    return requireBooleanResponse(result?.isSuperAdmin, "isSuperAdmin");
  }
}
