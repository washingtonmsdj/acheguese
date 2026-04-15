/**
 * useAdminGuard
 *
 * Hook que verifica se o perfil ativo tem permissão de moderação
 * usando AuthorizationEngine como fonte única de verdade.
 *
 * Substitui: profileContext?.permissions.canModerate
 * Padrão correto: AuthorizationEngine.canProfilePerformAction(...)
 */
import { useState, useEffect, useCallback } from "react";
import { useSessionContext } from "@/core/session";
import { AuthorizationEngine } from "@/core/authorization";

export function useAdminGuard() {
  const { activeProfile, isLoading: sessionLoading } = useSessionContext();
  const [canModerate, setCanModerate] = useState<boolean | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!activeProfile) {
      setCanModerate(false);
      return;
    }
    AuthorizationEngine.canProfilePerformAction(
      activeProfile.id,
      "moderateContent",
      {},
    ).then(setCanModerate);
  }, [activeProfile, sessionLoading]);

  return {
    canModerate,
    // null = ainda carregando, false = negado, true = permitido
    isChecking: canModerate === null,
  };
}
