/**
 * HOOK PROFISSIONAL PARA LOADING STATES
 *
 * Gerenciamento consistente de estados de carregamento.
 * Integrado com error handling e feedback visual.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useAsyncError } from "./useAsyncError";

interface LoadingStateOptions {
  minDuration?: number; // Duração mínima do loading (evita flash)
  showToast?: boolean;
  errorMessage?: string;
}

/**
 * Hook para gerenciar loading state
 *
 * @example
 * ```tsx
 * const { loading, withLoading } = useLoadingState();
 *
 * const fetchData = async () => {
 *   const data = await withLoading(async () => {
 *     const posts = await postService.getFeed();
 *     return posts;
 *   });
 *
 *   if (data) {
 *     setPosts(data);
 *   }
 * };
 *
 * return loading ? <Skeleton /> : <Content />;
 * ```
 */
export function useLoadingState(options: LoadingStateOptions = {}) {
  const { minDuration = 0, showToast = true, errorMessage } = options;

  const [loading, setLoading] = useState(false);
  const { handleAsync } = useAsyncError();
  const startTimeRef = useRef<number>(0);

  const withLoading = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      startTimeRef.current = Date.now();
      setLoading(true);

      try {
        const result = await handleAsync(fn, {
          showToast,
          toastMessage: errorMessage,
        });

        // Garantir duração mínima do loading
        if (minDuration > 0) {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = minDuration - elapsed;

          if (remaining > 0) {
            await new Promise((resolve) => setTimeout(resolve, remaining));
          }
        }

        return result;
      } finally {
        setLoading(false);
      }
    },
    [handleAsync, minDuration, showToast, errorMessage],
  );

  return {
    loading,
    withLoading,
    setLoading,
  };
}

/**
 * Hook para múltiplos loading states
 *
 * @example
 * ```tsx
 * const { isLoading, startLoading, stopLoading } = useMultipleLoadingStates();
 *
 * const fetchUsers = async () => {
 *   startLoading('users');
 *   const users = await getUsers();
 *   stopLoading('users');
 * };
 *
 * const fetchPosts = async () => {
 *   startLoading('posts');
 *   const posts = await getPosts();
 *   stopLoading('posts');
 * };
 *
 * return (
 *   <>
 *     {isLoading('users') && <UsersSkeleton />}
 *     {isLoading('posts') && <PostsSkeleton />}
 *   </>
 * );
 * ```
 */
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(
    () => new Map(),
  );

  const startLoading = useCallback((key: string) => {
    setLoadingStates((prev) => new Map(prev).set(key, true));
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingStates((prev) => new Map(prev).set(key, false));
  }, []);

  const isLoading = useCallback(
    (key: string) => loadingStates.get(key) === true,
    [loadingStates],
  );

  const isAnyLoading = useCallback(
    () => Array.from(loadingStates.values()).some(Boolean),
    [loadingStates],
  );

  return {
    isLoading,
    isAnyLoading,
    startLoading,
    stopLoading,
    loadingStates,
  };
}

/**
 * Hook para loading state com timeout
 *
 * @example
 * ```tsx
 * const { loading, withLoadingTimeout } = useLoadingTimeout(5000);
 *
 * const fetchData = async () => {
 *   const data = await withLoadingTimeout(async () => {
 *     return await slowAPI();
 *   }, {
 *     onTimeout: () => {
 *       toast.warning('Operação está demorando mais que o esperado...');
 *     }
 *   });
 * };
 * ```
 */
export function useLoadingTimeout(timeoutMs: number = 10000) {
  const [loading, setLoading] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const { handleAsync } = useAsyncError();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const withLoadingTimeout = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options?: {
        onTimeout?: () => void;
        showToast?: boolean;
      },
    ): Promise<T | null> => {
      setLoading(true);
      setTimedOut(false);

      // Configurar timeout
      timeoutIdRef.current = setTimeout(() => {
        setTimedOut(true);
        if (options?.onTimeout) {
          options.onTimeout();
        }
      }, timeoutMs);

      try {
        const result = await handleAsync(fn, {
          showToast: options?.showToast ?? true,
        });
        return result;
      } finally {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
        setLoading(false);
        setTimedOut(false);
      }
    },
    [handleAsync, timeoutMs],
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return {
    loading,
    timedOut,
    withLoadingTimeout,
  };
}

/**
 * Hook para loading state com progresso
 *
 * @example
 * ```tsx
 * const { loading, progress, withProgress } = useLoadingProgress();
 *
 * const uploadFiles = async (files: File[]) => {
 *   await withProgress(async (updateProgress) => {
 *     for (let i = 0; i < files.length; i++) {
 *       await uploadFile(files[i]);
 *       updateProgress((i + 1) / files.length * 100);
 *     }
 *   });
 * };
 *
 * return (
 *   <>
 *     {loading && <ProgressBar value={progress} />}
 *   </>
 * );
 * ```
 */
export function useLoadingProgress() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { handleAsync } = useAsyncError();

  const withProgress = useCallback(
    async <T>(
      fn: (updateProgress: (value: number) => void) => Promise<T>,
    ): Promise<T | null> => {
      setLoading(true);
      setProgress(0);

      try {
        const result = await handleAsync(
          () => fn((value) => setProgress(Math.min(100, Math.max(0, value)))),
          { showToast: true },
        );

        // Garantir que chegue a 100%
        setProgress(100);

        return result;
      } finally {
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
        }, 300); // Pequeno delay para mostrar 100%
      }
    },
    [handleAsync],
  );

  return {
    loading,
    progress,
    withProgress,
  };
}
