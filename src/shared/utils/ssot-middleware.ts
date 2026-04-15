import { toast } from "sonner";
import { SSOTValidators } from "@/shared/types/constants";
import { logger } from "@/shared/utils/logger";

/**
 * Middleware para validação SSOT automática
 * Intercepta operações e valida conformidade antes de enviar ao banco
 */
export class SSOTMiddleware {
  /**
   * Valida dados antes de inserir/atualizar no banco
   */
  static validateBeforeWrite(
    table: string,
    data: Record<string, unknown>,
  ): boolean {
    try {
      switch (table) {
        case "ride_requests":
          if (data.status && typeof data.status === "string") {
            if (!SSOTValidators.isValidRideStatus(data.status)) {
              throw new Error(`Invalid ride status: ${data.status}`);
            }
          }
          if (data.payment_method && typeof data.payment_method === "string") {
            if (!SSOTValidators.isValidPaymentMethod(data.payment_method)) {
              throw new Error(`Invalid payment method: ${data.payment_method}`);
            }
          }
          break;

        case "profiles":
          if (data.role && typeof data.role === "string") {
            if (!SSOTValidators.isValidUserRole(data.role)) {
              throw new Error(`Invalid user role: ${data.role}`);
            }
          }
          break;

        case "ride_reports":
          if (data.status && typeof data.status === "string") {
            if (!SSOTValidators.isValidReportStatus(data.status)) {
              throw new Error(`Invalid report status: ${data.status}`);
            }
          }
          break;

        case "companies":
          if (
            data.subscription_plan &&
            typeof data.subscription_plan === "string"
          ) {
            if (
              !SSOTValidators.isValidSubscriptionPlan(data.subscription_plan)
            ) {
              throw new Error(
                `Invalid subscription plan: ${data.subscription_plan}`,
              );
            }
          }
          break;
      }

      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Validation error";
      logger.error("SSOT Validation Error:", message);
      toast.error("Erro de validação SSOT", {
        description: message,
      });
      return false;
    }
  }

  /**
   * Sanitiza dados de entrada para conformidade SSOT
   */
  static sanitizeData(
    table: string,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized = { ...data };

    switch (table) {
      case "ride_requests":
        if (typeof sanitized.status === "string") {
          sanitized.status = sanitized.status.toLowerCase().trim();
        }
        if (typeof sanitized.payment_method === "string") {
          sanitized.payment_method = sanitized.payment_method
            .toLowerCase()
            .trim();
        }
        break;

      case "profiles":
        if (typeof sanitized.role === "string") {
          sanitized.role = sanitized.role.toLowerCase().trim();
        }
        break;
    }

    return sanitized;
  }
}

/**
 * Hook para usar middleware SSOT em componentes React
 */
export function useSSOTMiddleware() {
  return {
    validateBeforeWrite: SSOTMiddleware.validateBeforeWrite,
    sanitizeData: SSOTMiddleware.sanitizeData,
  };
}
