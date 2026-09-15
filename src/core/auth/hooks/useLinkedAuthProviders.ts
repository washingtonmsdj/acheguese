import { useCallback, useEffect, useRef, useState } from "react";

import {
  AuthIdentityService,
  type LinkedAuthProviders,
} from "@/core/auth/services/AuthIdentityService";
import { logger } from "@/shared/utils/logger";

const EMPTY_PROVIDERS: LinkedAuthProviders = {
  providers: [],
  hasPassword: false,
  hasGoogle: false,
};

export function useLinkedAuthProviders() {
  const [data, setData] = useState<LinkedAuthProviders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const refreshRequestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = refreshRequestIdRef.current + 1;
    refreshRequestIdRef.current = requestId;

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
      setData(null);
    }

    try {
      const nextData = await AuthIdentityService.getLinkedProviders();
      if (
        !mountedRef.current ||
        requestId !== refreshRequestIdRef.current
      ) {
        return;
      }
      setData(nextData);
    } catch (cause) {
      logger.error("useLinkedAuthProviders.refresh", cause);
      if (
        !mountedRef.current ||
        requestId !== refreshRequestIdRef.current
      ) {
        return;
      }
      setData(null);
      setError("Não foi possível consultar os métodos de acesso vinculados.");
    } finally {
      if (
        mountedRef.current &&
        requestId === refreshRequestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => {
      mountedRef.current = false;
      refreshRequestIdRef.current += 1;
    };
  }, [refresh]);

  const resolvedData = data ?? EMPTY_PROVIDERS;

  return {
    ...resolvedData,
    loading,
    error,
    isResolved: data !== null && error === null,
    refresh,
  };
}
