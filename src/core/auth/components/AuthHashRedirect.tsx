/**
 * AuthHashRedirect
 *
 * Trata callbacks de recuperação que chegam fora da rota canônica.
 * Erros OAuth pertencem à rota de termos e nunca devem ser confundidos com
 * link de recuperação de senha expirado.
 */
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
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
      navigate(`${AUTH_PATHS.passwordReset}?expired=1`, { replace: true });
      return;
    }

    if (isPasswordRecoveryCallback(location.search, location.hash)) {
      handled.current = true;
      navigate(
        { pathname: AUTH_PATHS.passwordReset, search: location.search },
        { replace: true },
      );
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
}
