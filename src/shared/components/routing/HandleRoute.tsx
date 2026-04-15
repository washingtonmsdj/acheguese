import React from "react";
/**
 * Componente de rota para handles com @
 * Intercepta URLs que começam com @ e redireciona para 404
 *
 * Solução profissional para suportar @ em URLs sem usar caracteres especiais
 * no path do React Router
 */

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logger } from "@/shared/utils/logger";
export default function HandleRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extrai o handle da URL (remove o @ do início)
  const handle = location.pathname.substring(2); // Remove "/@"

  useEffect(() => {
    if (import.meta.env.DEV) {
      logger.info("HandleRoute: URL com @ detectada, redirecionando para 404:", location.pathname);
    }
    // Redireciona para 404, pois a rota standalone não existe mais
    navigate("/404", { replace: true });
  }, [location.pathname, navigate]);

  // Retorna null, o redirecionamento será feito pelo useEffect
  return null;
}
