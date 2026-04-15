import { useState, useEffect } from "react";
import { logger } from "@/shared/utils/logger";
/**
 * Hook for persistir state no localStorage
 * @param key - Chave única no localStorage
 * @param defaultValue - Valor padrão se não houver nada salvo
 * @returns [value, setValue] - Tupla similar ao useState
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  // Inicializar com valor do localStorage ou valor padrão
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      logger.warn(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  });

  // Atualizar localStorage quando o state mudar
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      logger.warn(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, state]);

  return [state, setState];
}
