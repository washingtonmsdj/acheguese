/**
 * PROFILE.1.3b - BURN-DOWN AGRESSIVO
 *
 * useUserType migrado para usar useSessionContext + AuthorizationEngine
 * Elimina regras manuais: canPost, canComment
 * Migrado: useAuth → useSessionContext, profileContext.permissions → AuthorizationEngine
 */

import { useState, useEffect } from "react";
import { useSessionContext } from "@/core/session";
import { AuthorizationEngine } from "@/core/authorization";
import { logger } from "@/shared/utils/logger";

/**
 * Hook for verify o tipo de conta do usuário (pessoa física ou business)
 *
 * ✅ MIGRADO - Agora usa AuthorizationEngine para determinar permissões
 *
 * Requirement 2: Restrição de Postagem e Comentários para Empresas
 * - Empresas (Business accounts) NÃO podem create posts ou comentários
 * - Empresas podem apenas visualizar conteúdo
 *
 * @returns {Object} Objeto contendo:
 *   - canPost: boolean - Se o usuário pode create posts
 *   - canComment: boolean - Se o usuário pode comentar
 *   - isBusiness: boolean - Se o usuário é uma business
 *   - loading: boolean - Estado de carregamento
 */
export function useUserType() {
  const {
    user,
    activeProfile,
    isLoading: sessionLoading,
  } = useSessionContext();
  const [canPost, setCanPost] = useState(false);
  const [canComment, setCanComment] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      if (!user || !activeProfile) {
        setCanPost(false);
        setCanComment(false);
        setLoading(false);
        return;
      }

      try {
        const [postAllowed, commentAllowed] = await Promise.all([
          AuthorizationEngine.canProfilePerformAction(
            activeProfile.id,
            "createPost",
            {},
          ),
          AuthorizationEngine.canProfilePerformAction(
            activeProfile.id,
            "createComment",
            {},
          ),
        ]);
        setCanPost(postAllowed);
        setCanComment(commentAllowed);
      } catch (err) {
        logger.error("Error in useUserType:", err);
        setCanPost(false);
        setCanComment(false);
      } finally {
        setLoading(false);
      }
    }

    if (!sessionLoading) {
      loadPermissions();
    }
  }, [user, activeProfile, sessionLoading]);

  // Determinar se é business baseado no profileType do activeProfile
  const isBusiness = activeProfile?.profileType === "business";

  return {
    canPost,
    canComment,
    isBusiness,
    loading: sessionLoading || loading,
  };
}
