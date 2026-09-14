import { setWorkerUrl } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

let workerConfigured = false;

/**
 * Configura o worker ESM do MapLibre somente quando um mapa real for usado.
 *
 * Este módulo deve permanecer atrás de import dinâmico para que maplibre-gl e
 * o worker não façam parte do caminho crítico da primeira pintura.
 */
export function ensureMapLibreWorkerConfigured(): void {
  if (workerConfigured) return;
  setWorkerUrl(maplibreWorkerUrl);
  workerConfigured = true;
}
