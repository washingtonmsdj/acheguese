import { useCallback, useState } from "react";

const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "").trim();

export function useAuthTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const enabled = SITE_KEY.length > 0;
  const reset = useCallback(() => setToken(null), []);
  return {
    enabled,
    token,
    setToken,
    reset,
    /** true = pode submeter (sem gate) OU já tem token válido. */
    isReady: !enabled || Boolean(token),
    siteKey: SITE_KEY,
  };
}
