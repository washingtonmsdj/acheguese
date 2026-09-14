type IdleCapableWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * Agenda trabalho não crítico depois do primeiro paint quando o navegador
 * oferece requestIdleCallback. O timeout evita que o trabalho fique adiado
 * indefinidamente em páginas ocupadas. Retorna sempre uma função de cancelamento.
 */
export function scheduleBrowserIdleWork(
  task: () => void,
  options: { timeoutMs?: number; fallbackDelayMs?: number } = {},
): () => void {
  if (typeof window === "undefined") {
    task();
    return () => undefined;
  }

  const timeoutMs = options.timeoutMs ?? 700;
  const fallbackDelayMs = options.fallbackDelayMs ?? 120;
  const idleWindow = window as IdleCapableWindow;

  if (typeof idleWindow.requestIdleCallback === "function") {
    const handle = idleWindow.requestIdleCallback(task, { timeout: timeoutMs });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(task, fallbackDelayMs);
  return () => window.clearTimeout(handle);
}
