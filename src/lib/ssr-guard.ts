/**
 * 🔒 SSR Guard - Utilitários para proteção contra erros de SSR/hidratação
 * 
 * Todos os acessos a APIs de browser (window, document, localStorage, navigator, etc.)
 * devem passar por estes guards.
 * 
 * @version 1.0.0
 */

/**
 * Verifica se estamos no ambiente do browser (client-side)
 */
export const isBrowser = (): boolean => {
  return typeof window !== "undefined";
};

/**
 * Verifica se estamos no ambiente do servidor (SSR)
 */
export const isServer = (): boolean => {
  return typeof window === "undefined";
};

/**
 * Acessa window com segurança - retorna undefined no servidor
 */
export const getWindow = (): Window | undefined => {
  return isBrowser() ? window : undefined;
};

/**
 * Acessa document com segurança - retorna undefined no servidor
 */
export const getDocument = (): Document | undefined => {
  return isBrowser() ? document : undefined;
};

/**
 * Acessa localStorage com segurança - retorna null no servidor
 */
export const getLocalStorage = (): Storage | null => {
  if (!isBrowser()) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/**
 * Acessa navigator com segurança - retorna undefined no servidor
 */
export const getNavigator = (): Navigator | undefined => {
  return isBrowser() ? navigator : undefined;
};

/**
 * Executa função apenas no browser
 */
export const onBrowser = <T>(fn: () => T): T | undefined => {
  if (isBrowser()) {
    return fn();
  }
  return undefined;
};

/**
 * Hook-safe: executa callback apenas se estiver no browser
 * Útil para useEffect e outros hooks que rodam no client
 */
export const safeBrowserCall = (fn: () => void): void => {
  if (isBrowser()) {
    fn();
  }
};

/**
 * Verifica se localStorage está disponível (alguns browsers bloqueiam)
 */
export const isLocalStorageAvailable = (): boolean => {
  if (!isBrowser()) return false;
  try {
    const test = "__test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safe localStorage getItem
 */
export const safeGetItem = (key: string): string | null => {
  if (!isLocalStorageAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * Safe localStorage setItem
 */
export const safeSetItem = (key: string, value: string): boolean => {
  if (!isLocalStorageAvailable()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safe localStorage removeItem
 */
export const safeRemoveItem = (key: string): boolean => {
  if (!isLocalStorageAvailable()) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safe setInterval que retorna null no servidor
 */
export const safeSetInterval = (callback: () => void, ms: number): number | null => {
  if (!isBrowser()) return null;
  return window.setInterval(callback, ms);
};

/**
 * Safe setTimeout que retorna null no servidor
 */
export const safeSetTimeout = (callback: () => void, ms: number): number | null => {
  if (!isBrowser()) return null;
  return window.setTimeout(callback, ms);
};

/**
 * Safe clearInterval
 */
export const safeClearInterval = (id: number | null): void => {
  if (id === null || !isBrowser()) return;
  window.clearInterval(id);
};

/**
 * Safe clearTimeout
 */
export const safeClearTimeout = (id: number | null): void => {
  if (id === null || !isBrowser()) return;
  window.clearTimeout(id);
};

/**
 * Safe requestAnimationFrame
 */
export const safeRequestAnimationFrame = (callback: FrameRequestCallback): number | null => {
  if (!isBrowser()) return null;
  return requestAnimationFrame(callback);
};

/**
 * Safe cancelAnimationFrame
 */
export const safeCancelAnimationFrame = (id: number | null): void => {
  if (id === null || !isBrowser()) return;
  cancelAnimationFrame(id);
};

/**
 * Safe getGamepads (navigator.getGamepads)
 */
export const safeGetGamepads = (): (Gamepad | null)[] => {
  if (!isBrowser()) return [];
  const nav = getNavigator();
  if (!nav?.getGamepads) return [];
  return nav.getGamepads();
};

/**
 * Safe addEventListener em window
 */
export const safeAddWindowListener = (
  type: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions
): (() => void) | null => {
  if (!isBrowser()) return null;
  window.addEventListener(type, listener, options);
  return () => window.removeEventListener(type, listener, options);
};

/**
 * Safe matchMedia
 */
export const safeMatchMedia = (query: string): MediaQueryList | null => {
  if (!isBrowser()) return null;
  return window.matchMedia(query);
};
