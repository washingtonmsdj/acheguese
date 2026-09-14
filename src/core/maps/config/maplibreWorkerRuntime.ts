import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

let workerConfigured = false;

type SetWorkerUrl = (url: string) => void;

/**
 * Configura o worker ESM do MapLibre somente quando um mapa real for usado.
 *
 * O owner recebe `setWorkerUrl` da engine já carregada, evitando importar
 * `maplibre-gl` uma segunda vez apenas para configurar o worker.
 */
export function ensureMapLibreWorkerConfigured(setWorkerUrl: SetWorkerUrl): void {
  if (workerConfigured) return;
  setWorkerUrl(maplibreWorkerUrl);
  workerConfigured = true;
}
