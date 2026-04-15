/**
 * HOOK PROFISSIONAL PARA ERROR HANDLING
 *
 * Tratamento consistente de erros assíncronos em toda a aplicação.
 * Fornece feedback visual automático e logging estruturado.
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";

interface AsyncErrorOptions {
  showToast?: boolean;
  toastMessage?: string;
  logError?: boolean;
  onError?: (error: Error) => void;
}

interface AsyncErrorState {
  error: Error | null;
  isError: boolean;
  clearError: () => void;
}

/**
 * Hook para tratamento de erros assíncronos
 *
 * @example
 * ```tsx
 * const { handleAsync, error, isError } = useAsyncError();
 *
 * const fetchData = async () => {
 *   const result = await handleAsync(
 *     async () => {
 *       const profiles = await profileService.listPublicProfiles();
 *       return profiles;
 *     },
 *     {
 *       showToast: true,
 *       toastMessage: 'Erro ao carregar perfis'
 *     }
 *   );
 *
 *   if (result) {
 *     setProfiles(result);
 *   }
 * };
 * ```
 */
export function useAsyncError(): AsyncErrorState & {
  handleAsync: <T>(
    fn: () => Promise<T>,
    options?: AsyncErrorOptions,
  ) => Promise<T | null>;
} {
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleAsync = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options: AsyncErrorOptions = {},
    ): Promise<T | null> => {
      const {
        showToast = true,
        toastMessage = "Ocorreu um erro. Tente novamente.",
        logError = true,
        onError,
      } = options;

      try {
        clearError();
        return await fn();
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Erro desconhecido");

        setError(error);

        if (logError) {
          logger.error("[AsyncError]", {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          });
        }

        if (showToast) {
          toast.error(toastMessage);
        }

        if (onError) {
          onError(error);
        }

        return null;
      }
    },
    [clearError],
  );

  return {
    error,
    isError: error !== null,
    clearError,
    handleAsync,
  };
}

/**
 * Hook para retry automático em caso de erro
 *
 * @example
 * ```tsx
 * const { execute, isRetrying, attempts } = useAsyncRetry({
 *   maxAttempts: 3,
 *   delayMs: 1000,
 * });
 *
 * const fetchData = async () => {
 *   const result = await execute(async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('Failed to fetch');
 *     return response.json();
 *   });
 * };
 * ```
 */
export function useAsyncRetry(
  options: {
    maxAttempts?: number;
    delayMs?: number;
    onRetry?: (attempt: number) => void;
  } = {},
) {
  const { maxAttempts = 3, delayMs = 1000, onRetry } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { handleAsync } = useAsyncError();

  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      const lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        setAttempts(attempt);

        if (attempt > 1) {
          setIsRetrying(true);
          if (onRetry) {
            onRetry(attempt);
          }
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const result = await handleAsync(fn, {
          showToast: attempt === maxAttempts, // Só mostra toast na última tentativa
          logError: attempt === maxAttempts,
        });

        if (result !== null) {
          setIsRetrying(false);
          setAttempts(0);
          return result;
        }
      }

      setIsRetrying(false);
      toast.error(`Falha após ${maxAttempts} tentativas`);
      return null;
    },
    [maxAttempts, delayMs, onRetry, handleAsync],
  );

  return {
    execute,
    isRetrying,
    attempts,
  };
}

/**
 * Hook para loading state com error handling integrado
 *
 * @example
 * ```tsx
 * const { loading, error, execute } = useAsyncState();
 *
 * const loadData = async () => {
 *   const data = await execute(async () => {
 *     const posts = await postService.getFeed();
 *     return posts;
 *   });
 *
 *   if (data) {
 *     setPosts(data);
 *   }
 * };
 * ```
 */
export function useAsyncState() {
  const [loading, setLoading] = useState(false);
  const { error, handleAsync, clearError } = useAsyncError();

  const execute = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options?: AsyncErrorOptions,
    ): Promise<T | null> => {
      setLoading(true);
      try {
        return await handleAsync(fn, options);
      } finally {
        setLoading(false);
      }
    },
    [handleAsync],
  );

  return {
    loading,
    error,
    execute,
    clearError,
  };
}

/**
 * Hook para debounce de operações assíncronas com error handling
 *
 * @example
 * ```tsx
 * const { debouncedExecute } = useAsyncDebounce(500);
 *
 * const handleSearch = (query: string) => {
 *   debouncedExecute(async () => {
 *     const results = await searchAPI(query);
 *     setResults(results);
 *   });
 * };
 * ```
 */
export function useAsyncDebounce(delayMs: number = 300) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { handleAsync } = useAsyncError();

  const debouncedExecute = useCallback(
    <T>(fn: () => Promise<T>, options?: AsyncErrorOptions) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        handleAsync(fn, options);
      }, delayMs);

      setTimeoutId(newTimeoutId);
    },
    [timeoutId, delayMs, handleAsync],
  );

  return {
    debouncedExecute,
  };
}
