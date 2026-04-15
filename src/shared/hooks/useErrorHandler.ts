import { useState, useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
interface ErrorState {
  error: Error | null;
  isError: boolean;
}

export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
  });

  const handleError = useCallback((error: Error | string, showToast = true) => {
    const errorObj = typeof error === "string" ? new Error(error) : error;

    logger.error("Error handled:", errorObj);

    setErrorState({
      error: errorObj,
      isError: true,
    });

    if (showToast) {
      toast.error(errorObj.message || "Ocorreu um erro inesperado");
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
    });
  }, []);

  const retry = useCallback(
    (fn: () => void | Promise<void>) => {
      clearError();
      try {
        const result = fn();
        if (result instanceof Promise) {
          result.catch(handleError);
        }
      } catch (error) {
        handleError(error as Error);
      }
    },
    [clearError, handleError],
  );

  return {
    error: errorState.error,
    isError: errorState.isError,
    handleError,
    clearError,
    retry,
  };
}
