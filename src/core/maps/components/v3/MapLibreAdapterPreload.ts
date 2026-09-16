import {
  loadMapLibreRuntime,
  preloadMapLibreRuntime,
  prewarmMapLibreWorkers,
} from "../../runtime/loadMapLibreRuntime";

/** Aquece somente engine/CSS/worker sem carregar o componente React. */
export function preloadMapLibreAdapterRuntime(): Promise<void> {
  return preloadMapLibreRuntime();
}

/**
 * Aquece engine + runtime React passivo + pool de workers. Mantém preloading
 * fora do módulo do componente para preservar Fast Refresh determinístico.
 */
export function preloadPassiveMapLibreAdapterRuntime(): Promise<void> {
  return Promise.all([
    loadMapLibreRuntime(),
    import("./MapLibrePassiveRuntime"),
    prewarmMapLibreWorkers(),
  ]).then(() => undefined);
}
