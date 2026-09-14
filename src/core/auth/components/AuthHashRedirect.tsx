/**
 * AuthHashRedirect
 *
 * Trata callbacks de recuperação que chegam fora da rota canônica.
 * Erros OAuth pertencem à rota de termos e nunca devem ser confundidos com
 * link de recuperação de senha expirado.
 */
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  AUTH_PATHS,
  AUTH_QUERY_KEYS,
  AUTH_QUERY_VALUES,
  buildExpiredPasswordResetPath,
} from "@/core/auth/constants/authFlow";
import {
  isExpiredPasswordRecoveryError,
  isPasswordRecoveryCallback,
} from "@/core/auth/utils/authCallback";

export function AuthHashRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    if (location.pathname === AUTH_PATHS.passwordReset) return;

    if (isExpiredPasswordRecoveryError(location.search, location.hash)) {
      handled.current = true;
      navigate(buildExpiredPasswordResetPath(), { replace: true });
      return;
    }

    if (isPasswordRecoveryCallback(location.search, location.hash)) {
      handled.current = true;
      const search = new URLSearchParams(location.search);
      search.set(AUTH_QUERY_KEYS.mode, AUTH_QUERY_VALUES.recovery);
      navigate(
        {
          pathname: AUTH_PATHS.passwordReset,
          search: `?${search.toString()}`,
          hash: location.hash,
        },
        { replace: true },
      );
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
}
