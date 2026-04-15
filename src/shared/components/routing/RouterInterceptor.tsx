import React from "react";
/**
 * Interceptor de Rotas para Handles com @
 *
 * Solução profissional para suportar @ em URLs
 * Intercepta navegação antes do React Router process
 */

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logger } from "@/shared/utils/logger";
interface RouterInterceptorProps {
  children: React.ReactNode;
}

export default function RouterInterceptor({
  children,
}: RouterInterceptorProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Intercepta URLs que começam com @
  useEffect(() => {
    const path = location.pathname;

    // Se a URL começa com /@, é uma rota standalone
    if (path.startsWith("/@")) {
      if (import.meta.env.DEV) {
        logger.info("🔍 RouterInterceptor: URL com @ detectada:", path);
      }
      const handle = path.substring(2); // Remove /@
      if (import.meta.env.DEV) {
        logger.info("🔍 RouterInterceptor: Handle extraído:", handle);
      }

      // Não faz nada, deixa o React Router process normalmente
      // A rota /:slug vai capturar @handle como um slug normal
    }
  }, [location.pathname]);

  // Verifica se é uma rota standalone (começa com @)
  const isStandaloneRoute = location.pathname.startsWith("/@");

  if (isStandaloneRoute) {
    // Redireciona para 404, pois a rota standalone não existe mais
    if (import.meta.env.DEV) {
      logger.info("RouterInterceptor: Rota standalone não existe mais, redirecionando para 404");
    }
    navigate("/404", { replace: true });
    return null;
  }

  // Renderiza rotas normais
  return <>{children}</>;
}
