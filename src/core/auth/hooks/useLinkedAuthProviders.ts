import { useCallback, useEffect, useState } from "react";

import {
  AuthIdentityService,
  type LinkedAuthProviders,
} from "@/core/auth/services/AuthIdentityService";
import { logger } from "@/shared/utils/logger";

const EMPTY_PROVIDERS: LinkedAuthProviders = {
  providers: [],
  hasGoogle: false,
};

export function useLinkedAuthProviders() {
  const [data, setData] = useState<LinkedAuthProviders>(EMPTY_PROVIDERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await AuthIdentityService.getLinkedProviders());
    } catch (cause) {
      logger.error("useLinkedAuthProviders.refresh", cause);
      setData(EMPTY_PROVIDERS);
      setError("Não foi possível consultar os métodos de acesso vinculados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...data,
    loading,
    error,
    refresh,
  };
}
