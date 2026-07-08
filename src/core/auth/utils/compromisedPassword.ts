import { HibpService } from "@/core/auth/services/HibpService";
import { logger } from "@/shared/utils/logger";

export interface PasswordCompromiseCheckResult {
  blocked: boolean;
  count: number;
  unavailable: boolean;
  message?: string;
}

export function formatCompromisedPasswordMessage(count: number): string {
  return `Esta senha apareceu ${count.toLocaleString("pt-BR")} vez(es) em vazamentos de dados conhecidos. Escolha uma senha diferente.`;
}

export async function checkPasswordCompromise(
  password: string,
): Promise<PasswordCompromiseCheckResult> {
  try {
    const result = await HibpService.checkPassword(password);

    if (!result.isPwned) {
      return { blocked: false, count: 0, unavailable: false };
    }

    return {
      blocked: true,
      count: result.count,
      unavailable: false,
      message: formatCompromisedPasswordMessage(result.count),
    };
  } catch (error) {
    logger.warn("HIBP password check unavailable", {
      error: error instanceof Error ? error.message : String(error),
    });

    return { blocked: false, count: 0, unavailable: true };
  }
}
