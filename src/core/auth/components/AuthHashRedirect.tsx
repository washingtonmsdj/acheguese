/**
 * AuthHashRedirect
 *
 * Detecta retornos do Supabase na URL raiz e redireciona para a rota correta.
 * Toda lógica de detecção delegada ao AuthService (SSOT de auth).
 *
 * Casos tratados:
 *  - #error=access_denied&error_code=otp_expired  → /reset-password?expired=1
 *  - ?code=...&mode=recovery                      → /reset-password (com query preservada)
 */
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthService } from '@/core/auth/services/AuthService';

export function AuthHashRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    if (location.pathname === '/reset-password') return;

    const hashError = AuthService.getAuthHashError();
    if (hashError?.errorCode === 'otp_expired' || hashError?.error === 'access_denied') {
      handled.current = true;
      navigate('/reset-password?expired=1', { replace: true });
      return;
    }

    if (AuthService.isRecoveryRedirect()) {
      handled.current = true;
      navigate({ pathname: '/reset-password', search: location.search }, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
}
